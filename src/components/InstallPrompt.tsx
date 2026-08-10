/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { CheckCircle2, Download, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

function isStandalone(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(display-mode: standalone)').matches
    : false;
}

export function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function handleInstall(): Promise<void> {
    if (!installPrompt) {
      setShowHelp((current) => !current);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  }

  if (installed) {
    return (
      <p className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-400/15 px-4 text-sm font-bold text-emerald-200 ring-1 ring-emerald-300/30">
        <CheckCircle2 aria-hidden="true" size={19} /> ติดตั้ง SmartExam แล้ว
      </p>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => void handleInstall()}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 font-bold text-navy-900 shadow-soft transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
      >
        {installPrompt ? (
          <Download aria-hidden="true" size={20} />
        ) : (
          <Smartphone aria-hidden="true" size={20} />
        )}
        ติดตั้ง SmartExam ลงเครื่อง
      </button>
      {showHelp && !installPrompt ? (
        <p
          role="status"
          className="mt-3 max-w-lg rounded-xl bg-white/10 p-3 text-sm leading-6 text-sky-100 ring-1 ring-white/15"
        >
          iPhone/iPad: กดปุ่มแชร์แล้วเลือก “เพิ่มไปยังหน้าจอโฮม” • คอมพิวเตอร์/Android:
          เปิดเมนูเบราว์เซอร์แล้วเลือก “ติดตั้งแอป” การติดตั้งต้องเปิดผ่าน HTTPS ก่อน
        </p>
      ) : null}
    </div>
  );
}
