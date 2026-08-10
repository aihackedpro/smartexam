/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { z } from 'zod';
import type { DeviceIdentityRecord, LicenseClaims, LicensePlan } from '../../types/domain';
import { licenseKeyId, licensePublicKey } from './licensePublicKey';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const licenseClaimsSchema = z
  .object({
    version: z.literal(2),
    app: z.literal('smartexam'),
    keyId: z.string().min(1),
    licenseId: z.string().min(8).max(80),
    deviceHash: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    plan: z.enum(['month', 'year', 'lifetime']),
    issuedAt: z.iso.datetime(),
    expiresAt: z.iso.datetime().nullable(),
  })
  .strict();

export type LicenseValidationError =
  | 'invalid-format'
  | 'invalid-signature'
  | 'wrong-device'
  | 'expired'
  | 'clock-invalid'
  | 'unsupported-key';

export interface LicenseValidationResult {
  readonly valid: boolean;
  readonly claims: LicenseClaims | null;
  readonly error: LicenseValidationError | null;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/') + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += base32Alphabet[(value << (5 - bits)) & 31];
  return output;
}

function formatDeviceCode(hash: Uint8Array): string {
  const encoded = bytesToBase32(hash);
  return `SME-D1-${encoded.match(/.{1,4}/g)?.join('-') ?? encoded}`;
}

function canonicalPublicKey(publicKey: JsonWebKey): string {
  return JSON.stringify({
    crv: publicKey.crv,
    kty: publicKey.kty,
    x: publicKey.x,
    y: publicKey.y,
  });
}

export function normalizeActivationKey(value: string): string {
  return value.trim().replaceAll(/\s+/g, '');
}

export function planLabel(plan: LicensePlan): string {
  if (plan === 'month') return '1 เดือน';
  if (plan === 'year') return '1 ปี';
  return 'ตลอดอายุการใช้งาน';
}

export function isClockRollback(
  now: Date,
  lastTrustedAt: string,
  toleranceMs = 5 * 60 * 1000,
): boolean {
  return now.getTime() + toleranceMs < Date.parse(lastTrustedAt);
}

export async function createDeviceIdentity(now = new Date()): Promise<DeviceIdentityRecord> {
  const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, [
    'sign',
    'verify',
  ]);
  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const hash = new Uint8Array(
    await crypto.subtle.digest('SHA-256', textEncoder.encode(canonicalPublicKey(publicKey))),
  );
  return {
    id: 'device',
    publicKey,
    privateKey: keyPair.privateKey,
    fingerprint: bytesToBase64Url(hash),
    deviceCode: formatDeviceCode(hash),
    createdAt: now.toISOString(),
  };
}

export async function proveDeviceIdentity(identity: DeviceIdentityRecord): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      identity.privateKey,
      challenge,
    );
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      identity.publicKey,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    return crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signature,
      challenge,
    );
  } catch {
    return false;
  }
}

export async function validateActivationKey(
  value: string,
  deviceHash: string,
  now = new Date(),
  verificationKey: JsonWebKey = licensePublicKey,
): Promise<LicenseValidationResult> {
  const normalized = normalizeActivationKey(value);
  const match = /^SE2\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(normalized);
  if (!match) return { valid: false, claims: null, error: 'invalid-format' };

  try {
    const payload = base64UrlToBytes(match[1] ?? '');
    const signature = base64UrlToBytes(match[2] ?? '');
    const parsed: unknown = JSON.parse(textDecoder.decode(payload));
    const result = licenseClaimsSchema.safeParse(parsed);
    if (!result.success) return { valid: false, claims: null, error: 'invalid-format' };
    const claims = result.data;
    if (claims.keyId !== licenseKeyId) {
      return { valid: false, claims, error: 'unsupported-key' };
    }

    const publicKey = await crypto.subtle.importKey(
      'jwk',
      verificationKey,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    const signatureValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signature,
      payload,
    );
    if (!signatureValid) return { valid: false, claims, error: 'invalid-signature' };
    if (claims.deviceHash !== deviceHash) {
      return { valid: false, claims, error: 'wrong-device' };
    }

    const currentTime = now.getTime();
    const issuedTime = Date.parse(claims.issuedAt);
    if (issuedTime > currentTime + 5 * 60 * 1000) {
      return { valid: false, claims, error: 'clock-invalid' };
    }
    if (claims.plan !== 'lifetime' && !claims.expiresAt) {
      return { valid: false, claims, error: 'invalid-format' };
    }
    if (claims.expiresAt && Date.parse(claims.expiresAt) <= currentTime) {
      return { valid: false, claims, error: 'expired' };
    }
    return { valid: true, claims, error: null };
  } catch {
    return { valid: false, claims: null, error: 'invalid-format' };
  }
}

export function validationErrorMessage(error: LicenseValidationError | null): string {
  switch (error) {
    case 'invalid-signature':
      return 'ลายเซ็นของ Activate Key ไม่ถูกต้อง ระบบจึงปฏิเสธคีย์นี้';
    case 'wrong-device':
      return 'Activate Key นี้ออกให้เครื่องอื่น กรุณาส่ง Key โปรแกรมของเครื่องนี้ให้ผู้ขาย';
    case 'expired':
      return 'Activate Key หมดอายุแล้ว กรุณาติดต่อเพื่อต่ออายุ';
    case 'clock-invalid':
      return 'วันที่หรือเวลาของเครื่องไม่ถูกต้อง กรุณาตั้งเวลาอัตโนมัติแล้วลองใหม่';
    case 'unsupported-key':
      return 'Activate Key ใช้กุญแจคนละรุ่นกับแอป กรุณาขอคีย์ใหม่';
    default:
      return 'Activate Key ไม่ถูกต้อง กรุณาคัดลอกคีย์ให้ครบแล้วลองอีกครั้ง';
  }
}
