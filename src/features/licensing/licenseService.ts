/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { database } from '../../database/database';
import type {
  DeviceIdentityRecord,
  LicenseClaims,
  LicensePlan,
  LicenseRecord,
} from '../../types/domain';
import {
  createDeviceIdentity,
  isClockRollback,
  planLabel,
  proveDeviceIdentity,
  validateActivationKey,
  validationErrorMessage,
  type LicenseValidationError,
} from './licenseDomain';

const freeScanLimit = 10;
const dataChangeEvent = 'smartexam:data-change';

export type LicenseState = 'trial' | 'active' | 'expired' | 'invalid' | 'clock-invalid';

export interface ActivationOverview {
  readonly loading: boolean;
  readonly state: LicenseState;
  readonly active: boolean;
  readonly deviceCode: string;
  readonly plan: LicensePlan | null;
  readonly planName: string;
  readonly licenseId: string;
  readonly expiresAt: string | null;
  readonly scanUsageCount: number;
  readonly remainingScans: number;
  readonly message: string;
}

export interface ActivationResult {
  readonly success: boolean;
  readonly error: LicenseValidationError | 'device-invalid' | null;
  readonly message: string;
  readonly claims: LicenseClaims | null;
}

export const initialActivationOverview: ActivationOverview = {
  loading: true,
  state: 'trial',
  active: false,
  deviceCode: 'กำลังสร้าง Key โปรแกรม…',
  plan: null,
  planName: 'ทดลองใช้',
  licenseId: '',
  expiresAt: null,
  scanUsageCount: 0,
  remainingScans: freeScanLimit,
  message: '',
};

function notifyDataChange(): void {
  window.dispatchEvent(new Event(dataChangeEvent));
}

export async function getOrCreateDeviceIdentity(): Promise<DeviceIdentityRecord> {
  const stored = await database.deviceIdentities.get('device');
  if (stored && (await proveDeviceIdentity(stored))) return stored;

  await database.licenses.delete('license');
  const identity = await createDeviceIdentity();
  await database.deviceIdentities.put(identity);
  return identity;
}

async function getStoredLicenseEvaluation(
  identity: DeviceIdentityRecord,
  now: Date,
): Promise<{
  readonly active: boolean;
  readonly state: LicenseState;
  readonly claims: LicenseClaims | null;
  readonly message: string;
}> {
  const record = await database.licenses.get('license');
  if (!record) {
    return { active: false, state: 'trial', claims: null, message: '' };
  }

  if (isClockRollback(now, record.lastTrustedAt)) {
    return {
      active: false,
      state: 'clock-invalid',
      claims: null,
      message: 'ตรวจพบวันที่หรือเวลาย้อนกลับ กรุณาตั้งเวลาอัตโนมัติก่อนใช้งานต่อ',
    };
  }

  if (!(await proveDeviceIdentity(identity))) {
    return {
      active: false,
      state: 'invalid',
      claims: null,
      message: 'กุญแจประจำเครื่องเสียหาย จึงไม่สามารถยืนยันใบอนุญาตได้',
    };
  }

  const validation = await validateActivationKey(record.token, identity.fingerprint, now);
  if (!validation.valid) {
    const state = validation.error === 'expired' ? 'expired' : 'invalid';
    return {
      active: false,
      state,
      claims: validation.claims,
      message: validationErrorMessage(validation.error),
    };
  }

  if (now.getTime() > Date.parse(record.lastTrustedAt) + 60 * 1000) {
    await database.licenses.update('license', {
      lastTrustedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }
  return { active: true, state: 'active', claims: validation.claims, message: '' };
}

export async function getActivationOverview(now = new Date()): Promise<ActivationOverview> {
  const identity = await getOrCreateDeviceIdentity();
  const settings = await database.settings.get('app');
  const scanUsageCount = settings?.scanUsageCount ?? 0;
  const evaluation = await getStoredLicenseEvaluation(identity, now);
  const claims = evaluation.claims;
  return {
    loading: false,
    state: evaluation.state,
    active: evaluation.active,
    deviceCode: identity.deviceCode,
    plan: claims?.plan ?? null,
    planName: claims ? planLabel(claims.plan) : 'ทดลองใช้',
    licenseId: claims?.licenseId ?? '',
    expiresAt: claims?.expiresAt ?? null,
    scanUsageCount,
    remainingScans: Math.max(0, freeScanLimit - scanUsageCount),
    message: evaluation.message,
  };
}

export async function hasActiveLicense(now = new Date()): Promise<boolean> {
  const identity = await getOrCreateDeviceIdentity();
  return (await getStoredLicenseEvaluation(identity, now)).active;
}

export async function activateLicense(token: string, now = new Date()): Promise<ActivationResult> {
  const identity = await getOrCreateDeviceIdentity();
  if (!(await proveDeviceIdentity(identity))) {
    return {
      success: false,
      error: 'device-invalid',
      message: 'กุญแจประจำเครื่องเสียหาย กรุณาติดต่อผู้พัฒนา',
      claims: null,
    };
  }

  const validation = await validateActivationKey(token, identity.fingerprint, now);
  if (!validation.valid || !validation.claims) {
    return {
      success: false,
      error: validation.error,
      message: validationErrorMessage(validation.error),
      claims: validation.claims,
    };
  }

  const record: LicenseRecord = {
    id: 'license',
    token: token.trim().replaceAll(/\s+/g, ''),
    claims: validation.claims,
    activatedAt: now.toISOString(),
    lastTrustedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  await database.licenses.put(record);
  notifyDataChange();
  return {
    success: true,
    error: null,
    message: `เปิดใช้งานแพ็กเกจ ${planLabel(validation.claims.plan)} เรียบร้อยแล้ว`,
    claims: validation.claims,
  };
}
