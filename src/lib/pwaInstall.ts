/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

export interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export interface PwaInstallSnapshot {
  readonly canPrompt: boolean;
  readonly installed: boolean;
}

type InstallListener = () => void;
type InstallResult = 'accepted' | 'dismissed' | 'unavailable';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
let snapshot: PwaInstallSnapshot = { canPrompt: false, installed: false };
const listeners = new Set<InstallListener>();

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosNavigator = navigator as Navigator & { readonly standalone?: boolean };
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    iosNavigator.standalone === true
  );
}

function updateSnapshot(next: PwaInstallSnapshot): void {
  if (snapshot.canPrompt === next.canPrompt && snapshot.installed === next.installed) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function initializePwaInstall(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  updateSnapshot({ canPrompt: false, installed: isStandalone() });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    updateSnapshot({ canPrompt: true, installed: false });
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    updateSnapshot({ canPrompt: false, installed: true });
  });
}

export function subscribePwaInstall(listener: InstallListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPwaInstallSnapshot(): PwaInstallSnapshot {
  return snapshot;
}

export async function requestPwaInstall(): Promise<InstallResult> {
  const promptEvent = deferredPrompt;
  if (!promptEvent) return 'unavailable';

  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  deferredPrompt = null;
  updateSnapshot({ canPrompt: false, installed: choice.outcome === 'accepted' });
  return choice.outcome;
}
