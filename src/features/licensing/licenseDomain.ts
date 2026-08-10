/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function checksum(payload: string): string {
  let value = 0;
  for (const character of payload) {
    value = (value * 31 + character.charCodeAt(0)) % (alphabet.length * alphabet.length);
  }
  return `${alphabet[Math.floor(value / alphabet.length)]}${alphabet[value % alphabet.length]}`;
}

export function normalizeActivationKey(value: string): string {
  return value.trim().toUpperCase().replaceAll(/\s+/g, '');
}

export function validateActivationKey(value: string): boolean {
  const normalized = normalizeActivationKey(value);
  const match = /^SE1-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2})$/.exec(normalized);
  if (!match) return false;
  const payload = `${match[1]}${match[2]}`;
  return checksum(payload) === match[3];
}
