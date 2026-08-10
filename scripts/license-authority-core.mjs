/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { execFileSync } from 'node:child_process';
import { randomBytes, webcrypto } from 'node:crypto';
import { appendFileSync, chmodSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const keychainAccount = 'aihackedpro';
const keychainService = 'SmartExam License Authority v1';
export const licenseKeyId = 'owner-2026-01';
const expectedPublicKey = {
  crv: 'P-256',
  kty: 'EC',
  x: 'eK-O59EacNLTx1WP_A_JTohDnxjJ_Q0jLzUPz4w_PvA',
  y: 'sUIefcGAyxsOeLnp47p23aa2zxMB7fL11zwBrPQWgUM',
};
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const textEncoder = new TextEncoder();

function bytesToBase64Url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

function base32ToBytes(value) {
  let bits = 0;
  let buffer = 0;
  const output = [];
  for (const character of value) {
    const index = base32Alphabet.indexOf(character);
    if (index < 0) throw new Error('Key โปรแกรมมีตัวอักษรที่ไม่ถูกต้อง');
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(output);
}

function deviceCodeToHash(deviceCode) {
  const normalized = deviceCode.trim().toUpperCase().replaceAll(/\s+/g, '');
  if (!normalized.startsWith('SME-D1-')) {
    throw new Error('Key โปรแกรมต้องขึ้นต้นด้วย SME-D1-');
  }
  const encoded = normalized.slice('SME-D1-'.length).replaceAll('-', '');
  if (!/^[A-Z2-7]{52}$/.test(encoded)) {
    throw new Error('Key โปรแกรมไม่ครบหรือมีรูปแบบไม่ถูกต้อง');
  }
  const hash = base32ToBytes(encoded);
  if (hash.length !== 32) throw new Error('Key โปรแกรมมีขนาดไม่ถูกต้อง');
  return bytesToBase64Url(hash);
}

function getPrivateJwk() {
  try {
    const source = execFileSync(
      '/usr/bin/security',
      ['find-generic-password', '-a', keychainAccount, '-s', keychainService, '-w'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    return JSON.parse(source);
  } catch {
    throw new Error(
      'ไม่พบกุญแจส่วนตัว SmartExam ใน macOS Keychain จึงไม่สามารถออก Activate Key ได้',
    );
  }
}

function assertExpectedKey(privateJwk) {
  if (
    privateJwk.crv !== expectedPublicKey.crv ||
    privateJwk.kty !== expectedPublicKey.kty ||
    privateJwk.x !== expectedPublicKey.x ||
    privateJwk.y !== expectedPublicKey.y
  ) {
    throw new Error(
      'กุญแจใน Keychain ไม่ตรงกับ public key ที่ SmartExam ใช้ ระบบหยุดเพื่อความปลอดภัย',
    );
  }
}

function createLicenseId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `LIC-${date}-${randomBytes(5).toString('hex').toUpperCase()}`;
}

function calculateExpiry(plan, issuedAt) {
  if (plan === 'lifetime') return null;
  const days = plan === 'month' ? 30 : 365;
  return new Date(issuedAt.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function recordIssuedLicense(record) {
  const directory = join(
    homedir(),
    'Library',
    'Application Support',
    'SmartExam License Authority',
  );
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  appendFileSync(join(directory, 'issued-licenses.jsonl'), `${JSON.stringify(record)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  chmodSync(directory, 0o700);
  chmodSync(join(directory, 'issued-licenses.jsonl'), 0o600);
}

export function getAuthorityStatus() {
  const privateJwk = getPrivateJwk();
  assertExpectedKey(privateJwk);
  return { ready: true, keyId: licenseKeyId, storage: 'macOS Keychain' };
}

export async function issueLicense({ deviceCode, plan, start, licenseId, customerReference = '' }) {
  if (!deviceCode || !['month', 'year', 'lifetime'].includes(plan)) {
    throw new Error('กรุณาระบุ Key โปรแกรมและแพ็กเกจให้ถูกต้อง');
  }
  if (licenseId && !/^[A-Za-z0-9_-]{8,80}$/.test(licenseId)) {
    throw new Error('License ID ใช้ได้เฉพาะตัวอักษร ตัวเลข ขีดกลาง และขีดล่าง 8–80 ตัว');
  }

  const issuedAt = start ? new Date(start) : new Date();
  if (Number.isNaN(issuedAt.getTime())) throw new Error('วันเริ่มใช้งานไม่ถูกต้อง');
  const privateJwk = getPrivateJwk();
  assertExpectedKey(privateJwk);
  const privateKey = await webcrypto.subtle.importKey(
    'jwk',
    privateJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const claims = {
    version: 2,
    app: 'smartexam',
    keyId: licenseKeyId,
    licenseId: licenseId || createLicenseId(),
    deviceHash: deviceCodeToHash(deviceCode),
    plan,
    issuedAt: issuedAt.toISOString(),
    expiresAt: calculateExpiry(plan, issuedAt),
  };
  const payload = textEncoder.encode(JSON.stringify(claims));
  const signature = new Uint8Array(
    await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, payload),
  );
  const token = `SE2.${bytesToBase64Url(payload)}.${bytesToBase64Url(signature)}`;
  recordIssuedLicense({
    recordedAt: new Date().toISOString(),
    licenseId: claims.licenseId,
    deviceCode: deviceCode.trim().toUpperCase(),
    customerReference: customerReference.trim(),
    plan,
    issuedAt: claims.issuedAt,
    expiresAt: claims.expiresAt,
    token,
  });
  return { claims, token };
}
