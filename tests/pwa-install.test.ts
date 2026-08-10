/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { describe, expect, it, vi } from 'vitest';
import {
  getPwaInstallSnapshot,
  initializePwaInstall,
  requestPwaInstall,
} from '../src/lib/pwaInstall';

describe('PWA install prompt', () => {
  it('เก็บหน้าติดตั้งจากเบราว์เซอร์และเปิดเมื่อผู้ใช้กดปุ่ม', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.defineProperties(event, {
      prompt: { value: prompt },
      userChoice: {
        value: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      },
    });

    initializePwaInstall();
    window.dispatchEvent(event);

    expect(getPwaInstallSnapshot().canPrompt).toBe(true);
    await expect(requestPwaInstall()).resolves.toBe('accepted');
    expect(prompt).toHaveBeenCalledOnce();
    expect(getPwaInstallSnapshot()).toEqual({ canPrompt: false, installed: true });
  });
});
