/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { AlertTriangle, Camera, LoaderCircle, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { a4PortraitAspectRatio, calculateA4Crop } from './cameraGeometry';

interface CameraCaptureProps {
  readonly onCapture: (file: File) => void;
  readonly onClose: () => void;
}

type CameraState = 'starting' | 'ready' | 'error';

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'ยังไม่ได้อนุญาตใช้กล้อง กรุณาอนุญาตกล้องในเบราว์เซอร์แล้วลองใหม่';
  }
  if (error instanceof DOMException && error.name === 'NotFoundError') {
    return 'ไม่พบกล้องบนอุปกรณ์นี้ กรุณาเลือกภาพจากเครื่องแทน';
  }
  return 'เปิดกล้องไม่สำเร็จ กรุณาลองใหม่หรือเลือกภาพจากเครื่อง';
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(true);
  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [errorMessage, setErrorMessage] = useState('');
  const [capturing, setCapturing] = useState(false);

  const openCamera = useCallback(async (): Promise<void> => {
    await Promise.resolve();
    stopStream(streamRef.current);
    streamRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      if (!activeRef.current) return;
      setCameraState('error');
      setErrorMessage('เบราว์เซอร์นี้ไม่รองรับกล้องในแอป กรุณาเลือกภาพจากเครื่องแทน');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (!activeRef.current) {
        stopStream(stream);
        return;
      }
      streamRef.current = stream;
      if (!videoRef.current) {
        stopStream(stream);
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraState('ready');
    } catch (error) {
      if (!activeRef.current) return;
      setCameraState('error');
      setErrorMessage(getCameraErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    const startTimer = window.setTimeout(() => void openCamera(), 0);
    return () => {
      window.clearTimeout(startTimer);
      activeRef.current = false;
      stopStream(streamRef.current);
    };
  }, [openCamera]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function captureImage(): Promise<void> {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0 || capturing) return;

    setCapturing(true);
    try {
      const crop = calculateA4Crop(video.videoWidth, video.videoHeight);
      const outputWidth = 1400;
      const outputHeight = Math.round(outputWidth / a4PortraitAspectRatio);
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('ไม่สามารถเตรียมภาพจากกล้องได้');

      context.drawImage(
        video,
        crop.sourceX,
        crop.sourceY,
        crop.sourceWidth,
        crop.sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      );
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('สร้างภาพไม่สำเร็จ'))),
          'image/jpeg',
          0.92,
        );
      });
      stopStream(streamRef.current);
      streamRef.current = null;
      onCapture(new File([blob], `smartexam-capture-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    } catch (error) {
      setCameraState('error');
      setErrorMessage(error instanceof Error ? error.message : 'ถ่ายภาพไม่สำเร็จ กรุณาลองใหม่');
      setCapturing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-slate-950 text-white">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-guide-title"
        className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">กล้อง OMR</p>
            <h2 id="camera-guide-title" className="text-lg font-extrabold sm:text-xl">
              จัดจุดดำ 4 มุมให้ตรงเป้า
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">
              ให้เห็นกระดาษทั้งแผ่น ถือกล้องตรง และหลีกเลี่ยงเงาหรือแสงสะท้อน
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดกล้อง"
            className="grid min-h-12 min-w-12 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
          >
            <X aria-hidden="true" size={25} />
          </button>
        </div>

        <div className="my-3 flex min-h-0 flex-1 items-center justify-center sm:my-4">
          <div className="relative aspect-[210/297] max-h-[calc(100dvh-15.5rem)] w-full max-w-[min(100%,28rem)] overflow-hidden rounded-lg bg-slate-900 shadow-2xl ring-2 ring-white/80">
            <video
              ref={videoRef}
              muted
              playsInline
              aria-label="ภาพสดจากกล้องสำหรับจัดกระดาษคำตอบ"
              className={`size-full object-cover ${cameraState === 'ready' ? 'opacity-100' : 'opacity-30'}`}
            />

            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute inset-x-[8%] top-1/2 border-t border-dashed border-white/60" />
              <div className="absolute inset-y-[6%] left-1/2 border-l border-dashed border-white/60" />
              <div className="absolute inset-[4%] rounded-sm ring-2 ring-emerald-300/90" />
              <div className="absolute left-[3%] top-[3%] size-[6%] min-h-6 min-w-6 rounded-sm border-[3px] border-emerald-300 bg-emerald-300/10 shadow-[0_0_0_2px_rgba(255,255,255,0.8)]" />
              <div className="absolute right-[3%] top-[3%] size-[6%] min-h-6 min-w-6 rounded-sm border-[3px] border-emerald-300 bg-emerald-300/10 shadow-[0_0_0_2px_rgba(255,255,255,0.8)]" />
              <div className="absolute bottom-[3%] left-[3%] size-[6%] min-h-6 min-w-6 rounded-sm border-[3px] border-emerald-300 bg-emerald-300/10 shadow-[0_0_0_2px_rgba(255,255,255,0.8)]" />
              <div className="absolute bottom-[3%] right-[3%] size-[6%] min-h-6 min-w-6 rounded-sm border-[3px] border-emerald-300 bg-emerald-300/10 shadow-[0_0_0_2px_rgba(255,255,255,0.8)]" />
              <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-slate-950/75 px-3 py-1 text-center text-[11px] font-bold text-white">
                จุดดำต้องอยู่ในเป้าทั้ง 4 มุม
              </span>
            </div>

            {cameraState !== 'ready' ? (
              <div className="absolute inset-0 grid place-items-center bg-slate-950/70 p-6 text-center">
                {cameraState === 'starting' ? (
                  <div role="status">
                    <LoaderCircle
                      aria-hidden="true"
                      className="mx-auto animate-spin text-emerald-300"
                      size={38}
                    />
                    <p className="mt-3 font-bold">กำลังเปิดกล้อง…</p>
                  </div>
                ) : (
                  <div role="alert">
                    <AlertTriangle
                      aria-hidden="true"
                      className="mx-auto text-amber-300"
                      size={40}
                    />
                    <p className="mt-3 text-sm font-semibold leading-6">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraState('starting');
                        setErrorMessage('');
                        void openCamera();
                      }}
                      className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 font-bold text-navy-900"
                    >
                      <RefreshCw aria-hidden="true" size={20} /> ลองเปิดกล้องอีกครั้ง
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <p className="mb-3 text-center text-xs font-semibold text-slate-300">
          ระบบจะตัดภาพตามกรอบ A4 นี้อัตโนมัติ แล้วตรวจคำตอบบนเครื่อง
        </p>
        <button
          type="button"
          disabled={cameraState !== 'ready' || capturing}
          onClick={() => void captureImage()}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-lg font-extrabold text-slate-950 shadow-lg hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {capturing ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" size={24} />
          ) : (
            <Camera aria-hidden="true" size={24} />
          )}
          {capturing ? 'กำลังเตรียมภาพ…' : 'ถ่ายและตรวจคำตอบ'}
        </button>
      </section>
    </div>
  );
}
