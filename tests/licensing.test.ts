/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { beforeAll, describe, expect, it } from 'vitest';
import {
  createDeviceIdentity,
  isClockRollback,
  normalizeActivationKey,
  proveDeviceIdentity,
  validateActivationKey,
} from '../src/features/licensing/licenseDomain';
import { licenseKeyId } from '../src/features/licensing/licensePublicKey';
import type { LicenseClaims } from '../src/types/domain';

const encoder = new TextEncoder();
let ownerKeyPair: CryptoKeyPair;
let ownerPublicKey: JsonWebKey;

function bytesToBase64Url(source: ArrayBuffer): string {
  const bytes = new Uint8Array(source);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function signClaims(claims: LicenseClaims): Promise<string> {
  const payload = encoder.encode(JSON.stringify(claims));
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    ownerKeyPair.privateKey,
    payload,
  );
  return `SE2.${bytesToBase64Url(payload.buffer)}.${bytesToBase64Url(signature)}`;
}

function createClaims(update: Partial<LicenseClaims> = {}): LicenseClaims {
  return {
    version: 2,
    app: 'smartexam',
    keyId: licenseKeyId,
    licenseId: 'LIC-TEST-0001',
    deviceHash: 'A'.repeat(43),
    plan: 'year',
    issuedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2027-01-01T00:00:00.000Z',
    ...update,
  };
}

beforeAll(async () => {
  ownerKeyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]);
  ownerPublicKey = await crypto.subtle.exportKey('jwk', ownerKeyPair.publicKey);
});

describe('Activate Key แบบลงลายเซ็น', () => {
  it('จัดรูปแบบโดยตัดช่องว่างแต่ไม่เปลี่ยนตัวอักษรในลายเซ็น', () => {
    expect(normalizeActivationKey(' SE2.abc\n.DEF ')).toBe('SE2.abc.DEF');
  });

  it('สร้าง Device Key ที่พิสูจน์คู่กุญแจได้และมีรหัสประจำการติดตั้ง', async () => {
    const identity = await createDeviceIdentity(new Date('2026-01-01T00:00:00.000Z'));

    expect(identity.privateKey.extractable).toBe(false);
    expect(identity.deviceCode).toMatch(/^SME-D1-(?:[A-Z2-7]{4}-){12}[A-Z2-7]{4}$/);
    await expect(proveDeviceIdentity(identity)).resolves.toBe(true);
  });

  it('ยอมรับใบอนุญาตที่ลายเซ็นถูกและผูกกับเครื่องตรงกัน', async () => {
    const claims = createClaims();
    const token = await signClaims(claims);

    await expect(
      validateActivationKey(
        token,
        claims.deviceHash,
        new Date('2026-06-01T00:00:00.000Z'),
        ownerPublicKey,
      ),
    ).resolves.toMatchObject({ valid: true, claims, error: null });
  });

  it('ปฏิเสธคีย์ถูกแก้ ลายเซ็นผิด และคีย์ของเครื่องอื่น', async () => {
    const claims = createClaims();
    const token = await signClaims(claims);
    const tampered = token.replace('SE2.', 'SE2.A');

    await expect(
      validateActivationKey(
        tampered,
        claims.deviceHash,
        new Date('2026-06-01T00:00:00.000Z'),
        ownerPublicKey,
      ),
    ).resolves.toMatchObject({ valid: false });
    await expect(
      validateActivationKey(
        token,
        'B'.repeat(43),
        new Date('2026-06-01T00:00:00.000Z'),
        ownerPublicKey,
      ),
    ).resolves.toMatchObject({ valid: false, error: 'wrong-device' });
  });

  it('ปฏิเสธใบอนุญาตหมดอายุและใบอนุญาตที่ออกในอนาคต', async () => {
    const expired = createClaims({ expiresAt: '2026-02-01T00:00:00.000Z' });
    const future = createClaims({ issuedAt: '2026-08-01T00:00:00.000Z' });

    await expect(
      validateActivationKey(
        await signClaims(expired),
        expired.deviceHash,
        new Date('2026-06-01T00:00:00.000Z'),
        ownerPublicKey,
      ),
    ).resolves.toMatchObject({ valid: false, error: 'expired' });
    await expect(
      validateActivationKey(
        await signClaims(future),
        future.deviceHash,
        new Date('2026-06-01T00:00:00.000Z'),
        ownerPublicKey,
      ),
    ).resolves.toMatchObject({ valid: false, error: 'clock-invalid' });
  });

  it('ตรวจจับเวลาย้อนกลับเกินค่าผ่อนผัน', () => {
    expect(isClockRollback(new Date('2026-06-01T09:00:00.000Z'), '2026-06-01T10:00:00.000Z')).toBe(
      true,
    );
    expect(isClockRollback(new Date('2026-06-01T09:57:00.000Z'), '2026-06-01T10:00:00.000Z')).toBe(
      false,
    );
  });
});
