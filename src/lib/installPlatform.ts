/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

export type InstallPlatform = 'ios' | 'android' | 'desktop';

export interface InstallEnvironment {
  readonly userAgent: string;
  readonly platform: string;
  readonly maxTouchPoints: number;
}

export function detectInstallPlatform(
  environment: InstallEnvironment = {
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
    platform: typeof navigator === 'undefined' ? '' : navigator.platform,
    maxTouchPoints: typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints,
  },
): InstallPlatform {
  const userAgent = environment.userAgent.toLowerCase();
  const isTouchMac = environment.platform === 'MacIntel' && environment.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/.test(userAgent) || isTouchMac) return 'ios';
  if (userAgent.includes('android')) return 'android';
  return 'desktop';
}
