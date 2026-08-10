/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import {
  AlertTriangle,
  Camera,
  Check,
  ClipboardPlus,
  Image,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  Save,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import {
  freeScanLimit,
  listExams,
  saveNewScanResult,
  ScanLimitReachedError,
} from '../../database/repository';
import { useStoredData } from '../../hooks/useStoredData';
import { createId } from '../../lib/identifiers';
import type { Exam, MarkedAnswer } from '../../types/domain';
import { getActivationOverview, initialActivationOverview } from '../licensing/licenseService';
import { scoreAnswers } from '../results/scoring';
import { CameraCapture } from './CameraCapture';
import { analyzeAnswerSheet } from './omr';

const loadExams = () => listExams();
const loadActivationOverview = () => getActivationOverview();
const choiceLabels = ['ก', 'ข', 'ค', 'ง', 'จ'];

function createBlankAnswers(exam: Exam): readonly MarkedAnswer[] {
  return exam.questions.map((question) => ({
    questionId: question.id,
    choice: null,
    status: 'unanswered',
    confidence: null,
  }));
}

export function ScannerPage() {
  const { data: exams, loading } = useStoredData(loadExams, [] as readonly Exam[]);
  const { data: activation } = useStoredData(loadActivationOverview, initialActivationOverview);
  const [examId, setExamId] = useState('');
  const [examineeCode, setExamineeCode] = useState('');
  const [answers, setAnswers] = useState<readonly MarkedAnswer[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysisState, setAnalysisState] = useState<'idle' | 'analyzing' | 'complete' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');
  const [showActivation, setShowActivation] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === examId) ?? exams[0],
    [examId, exams],
  );
  const quotaReached = !activation.active && activation.scanUsageCount >= freeScanLimit;

  useEffect(
    () => () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    },
    [imageUrl],
  );

  async function analyzeFile(file: File): Promise<void> {
    if (!selectedExam) return;
    if (quotaReached) {
      setShowActivation(true);
      return;
    }
    setAnalysisState('analyzing');
    setMessage('กำลังค้นหาจุดอ้างอิงและอ่านวงคำตอบ…');
    try {
      const analysis = await analyzeAnswerSheet(file, selectedExam);
      setAnswers(analysis.answers);
      setAnalysisState('complete');
      const ambiguous = analysis.answers.filter((answer) => answer.status === 'ambiguous').length;
      setMessage(
        ambiguous > 0
          ? `อ่านภาพสำเร็จ ความมั่นใจเฉลี่ย ${(analysis.averageConfidence * 100).toFixed(0)}% • มี ${ambiguous} ข้อให้ครูยืนยัน`
          : `อ่านภาพสำเร็จ ความมั่นใจเฉลี่ย ${(analysis.averageConfidence * 100).toFixed(0)}% • พร้อมบันทึกคะแนน`,
      );
    } catch (error) {
      setAnswers(createBlankAnswers(selectedExam));
      setAnalysisState('error');
      setMessage(error instanceof Error ? error.message : 'วิเคราะห์ภาพไม่สำเร็จ กรุณาถ่ายใหม่');
    }
  }

  function handleImage(file: File | undefined): void {
    if (!file) return;
    if (quotaReached) {
      setShowActivation(true);
      return;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setImageFile(file);
    void analyzeFile(file);
  }

  function updateAnswer(questionId: string, update: Partial<MarkedAnswer>): void {
    setAnalysisState('complete');
    setAnswers((current) => {
      const source =
        selectedExam && current.length === selectedExam.questions.length
          ? current
          : selectedExam
            ? createBlankAnswers(selectedExam)
            : [];
      return source.map((answer) =>
        answer.questionId === questionId ? { ...answer, ...update } : answer,
      );
    });
  }

  async function handleSave(): Promise<void> {
    if (!selectedExam || analysisState !== 'complete') return;
    const currentAnswers =
      answers.length === selectedExam.questions.length ? answers : createBlankAnswers(selectedExam);
    const summary = scoreAnswers(selectedExam, currentAnswers);
    const timestamp = new Date().toISOString();
    const needsReview = currentAnswers.some((answer) => answer.status === 'ambiguous');
    try {
      const saved = await saveNewScanResult({
        id: createId('result'),
        examId: selectedExam.id,
        examineeCode: examineeCode.trim() || `ไม่ระบุ-${Date.now().toString().slice(-4)}`,
        answers: currentAnswers,
        score: summary.score,
        maxScore: summary.maxScore,
        reviewStatus: needsReview ? 'needs-review' : 'complete',
        createdAt: timestamp,
        updatedAt: timestamp,
        revision: 0,
        syncState: 'local',
      });
      setMessage(
        needsReview
          ? `บันทึกแผ่นที่ ${saved.scanUsageCount} คะแนน ${summary.score}/${summary.maxScore} และส่งข้อกำกวมไปรอตรวจแล้ว`
          : `บันทึกแผ่นที่ ${saved.scanUsageCount} เรียบร้อย คะแนน ${summary.score}/${summary.maxScore}`,
      );
      setExamineeCode('');
      setAnswers(createBlankAnswers(selectedExam));
      setAnalysisState('idle');
      setImageFile(null);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl('');
      if (saved.scanUsageCount >= freeScanLimit && !activation.active) {
        setShowActivation(true);
      }
    } catch (error) {
      if (error instanceof ScanLimitReachedError) {
        setShowActivation(true);
        setMessage(error.message);
      } else {
        setMessage('บันทึกผลไม่สำเร็จ กรุณาลองอีกครั้ง');
      }
    }
  }

  const currentAnswers =
    selectedExam && answers.length === selectedExam.questions.length
      ? answers
      : selectedExam
        ? createBlankAnswers(selectedExam)
        : [];
  const ambiguousCount = currentAnswers.filter((answer) => answer.status === 'ambiguous').length;
  const confirmedCount = currentAnswers.filter((answer) => answer.status === 'confirmed').length;
  const unansweredCount = currentAnswers.filter((answer) => answer.status === 'unanswered').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="OMR ตรวจด้วยมือถือ"
        title="สแกนตรวจ"
        description="ถ่ายกระดาษคำตอบ SmartExam ระบบค้นหาจุดสี่มุม อ่านวงคำตอบ คำนวณคะแนน และส่งเฉพาะข้อที่ไม่ชัดให้ครูยืนยัน"
        icon={ScanLine}
        action={
          <StatusBadge tone={activation.active ? 'success' : 'warning'}>
            {activation.active
              ? 'ไม่จำกัดจำนวนแผ่น'
              : `ใช้ฟรี ${activation.scanUsageCount}/${freeScanLimit} แผ่น`}
          </StatusBadge>
        }
      />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
        <p className="flex items-start gap-2 font-bold">
          <Sparkles aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
          อ่านคำตอบอัตโนมัติและตรวจซ้ำได้
        </p>
        <p className="mt-1 pl-7">
          ระบบให้คะแนนเฉพาะวงที่มั่นใจ ภาพใช้วิเคราะห์ในเครื่องและไม่ถูกเก็บในฐานข้อมูล
        </p>
      </div>

      <section
        aria-labelledby="photo-guide-heading"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"
      >
        <h2 id="photo-guide-heading" className="text-lg font-extrabold text-navy-900">
          ถ่ายอย่างไรให้ตรวจแม่น
        </h2>
        <ol className="mt-3 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-3">
          <li className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-800 font-extrabold text-white">
              1
            </span>
            <span>
              <strong className="block text-navy-900">วางกระดาษให้เรียบ</strong>ใช้แสงสม่ำเสมอ
              ไม่มีเงาหรือแสงสะท้อน
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-800 font-extrabold text-white">
              2
            </span>
            <span>
              <strong className="block text-navy-900">ให้เห็นทั้งแผ่น</strong>จัดจุดดำ 4
              มุมให้ตรงเป้าสีเขียว
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-800 font-extrabold text-white">
              3
            </span>
            <span>
              <strong className="block text-navy-900">ถือกล้องให้ตรง</strong>อย่าเอียง เบลอ
              หรือบังวงคำตอบ
            </span>
          </li>
        </ol>
      </section>

      {loading ? (
        <p role="status" className="p-6 text-center">
          กำลังเปิดรายการข้อสอบ…
        </p>
      ) : null}
      {!loading && exams.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center sm:p-10">
          <ClipboardPlus aria-hidden="true" className="mx-auto text-navy-700" size={38} />
          <h2 className="mt-3 text-xl font-extrabold text-navy-900">สร้างข้อสอบก่อนเริ่มสแกน</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            ระบบต้องใช้เฉลยและตำแหน่งวงคำตอบของข้อสอบเพื่อคำนวณคะแนน
          </p>
          <Link
            to="/exams"
            className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700"
          >
            <ClipboardPlus aria-hidden="true" size={20} /> สร้างข้อสอบใหม่
          </Link>
        </div>
      ) : null}

      {selectedExam ? (
        <>
          <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:grid-cols-2 sm:p-6">
            <label>
              <span className="mb-1.5 block text-sm font-bold text-slate-700">ข้อสอบ</span>
              <select
                value={selectedExam.id}
                onChange={(event) => {
                  const nextExam = exams.find((exam) => exam.id === event.target.value);
                  setExamId(event.target.value);
                  setAnswers(nextExam ? createBlankAnswers(nextExam) : []);
                  setAnalysisState('idle');
                  setMessage('');
                }}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-bold text-slate-700">รหัสผู้เข้าสอบ</span>
              <input
                value={examineeCode}
                onChange={(event) => setExamineeCode(event.target.value)}
                placeholder="ใช้รหัสแทนชื่อจริง"
                className="min-h-12 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">ภาพกระดาษคำตอบ</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={analysisState === 'analyzing'}
                  onClick={() => {
                    if (quotaReached) setShowActivation(true);
                    else setCameraOpen(true);
                  }}
                  className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-4 font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                    quotaReached
                      ? 'cursor-not-allowed bg-slate-100 text-slate-500 ring-1 ring-slate-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {analysisState === 'analyzing' ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" size={22} />
                  ) : (
                    <Camera aria-hidden="true" size={22} />
                  )}
                  {quotaReached ? 'ครบสิทธิ์ฟรีแล้ว' : 'เปิดกล้องพร้อมกรอบ'}
                </button>
                <label
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 font-bold ${
                    quotaReached
                      ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500'
                      : 'cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <Image aria-hidden="true" size={22} />
                  {quotaReached ? 'ครบสิทธิ์ฟรีแล้ว' : 'เลือกภาพจากเครื่อง'}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={quotaReached || analysisState === 'analyzing'}
                    className="sr-only"
                    onChange={(event) => {
                      handleImage(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                แนะนำให้ใช้ “เปิดกล้องพร้อมกรอบ” เพื่อจัดตำแหน่งและตัดภาพ A4 อัตโนมัติ
              </p>
            </div>
          </section>

          {imageUrl ? (
            <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-2 shadow-soft">
              <img
                src={imageUrl}
                alt="ภาพกระดาษคำตอบที่ระบบกำลังวิเคราะห์"
                className="mx-auto max-h-[60vh] rounded-2xl object-contain"
              />
              <figcaption className="flex flex-wrap items-center justify-center gap-3 p-2 text-center text-xs text-white">
                <span>ภาพนี้ไม่ถูกบันทึกเมื่อออกจากหน้า</span>
                {imageFile && analysisState !== 'analyzing' ? (
                  <button
                    type="button"
                    onClick={() => void analyzeFile(imageFile)}
                    className="min-h-10 rounded-lg bg-white/15 px-3 font-bold hover:bg-white/25"
                  >
                    วิเคราะห์ภาพอีกครั้ง
                  </button>
                ) : null}
              </figcaption>
            </figure>
          ) : null}

          {message ? (
            <p
              role={analysisState === 'error' ? 'alert' : 'status'}
              className={`rounded-xl p-4 font-semibold ${
                analysisState === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-navy-50 text-navy-900'
              }`}
            >
              {message}
            </p>
          ) : null}

          <section aria-labelledby="review-heading" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-700">ผลอ่าน OMR</p>
                <h2 id="review-heading" className="text-xl font-extrabold text-navy-900">
                  คำตอบ {selectedExam.questions.length} ข้อ
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="success">อ่านได้ {confirmedCount}</StatusBadge>
                <StatusBadge tone={ambiguousCount ? 'warning' : 'neutral'}>
                  รอตรวจ {ambiguousCount}
                </StatusBadge>
                <StatusBadge tone="neutral">ว่าง {unansweredCount}</StatusBadge>
              </div>
            </div>

            {selectedExam.questions.map((question, index) => {
              const answer = currentAnswers.find((item) => item.questionId === question.id);
              return (
                <article
                  key={question.id}
                  className={`rounded-2xl border bg-white p-4 ${
                    answer?.status === 'ambiguous' ? 'border-amber-300' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-navy-900">ข้อ {index + 1}</p>
                      <p className="line-clamp-2 text-sm text-slate-600">{question.prompt}</p>
                    </div>
                    <StatusBadge
                      tone={
                        answer?.status === 'ambiguous'
                          ? 'warning'
                          : answer?.status === 'confirmed'
                            ? 'success'
                            : 'neutral'
                      }
                    >
                      {answer?.status === 'ambiguous'
                        ? 'ครูต้องยืนยัน'
                        : answer?.status === 'confirmed'
                          ? `${Math.round((answer.confidence ?? 1) * 100)}%`
                          : 'เว้นว่าง'}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 min-[420px]:grid-cols-5">
                    {question.choices.map((_, choiceIndex) => (
                      <button
                        key={`${question.id}-${choiceIndex}`}
                        type="button"
                        aria-pressed={
                          answer?.status === 'confirmed' && answer.choice === choiceIndex
                        }
                        onClick={() =>
                          updateAnswer(question.id, {
                            choice: choiceIndex,
                            status: 'confirmed',
                            confidence: 1,
                          })
                        }
                        className={`min-h-12 rounded-xl border text-base font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                          answer?.status === 'confirmed' && answer.choice === choiceIndex
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-white text-navy-900 hover:bg-slate-50'
                        }`}
                      >
                        {choiceLabels[choiceIndex]}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateAnswer(question.id, {
                          choice: null,
                          status: 'ambiguous',
                          confidence: 0.4,
                        })
                      }
                      className="min-h-12 rounded-xl bg-amber-50 px-2 text-sm font-bold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                    >
                      รอตรวจ
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateAnswer(question.id, {
                          choice: null,
                          status: 'unanswered',
                          confidence: 1,
                        })
                      }
                      className="inline-flex min-h-12 items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
                    >
                      <RotateCcw aria-hidden="true" size={17} /> เว้นว่าง
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <button
            type="button"
            disabled={analysisState !== 'complete' || quotaReached}
            onClick={() => void handleSave()}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-lg font-extrabold text-white shadow-emerald transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ambiguousCount ? (
              <AlertTriangle aria-hidden="true" size={22} />
            ) : (
              <Check aria-hidden="true" size={22} />
            )}
            <Save aria-hidden="true" size={21} /> บันทึกผลตรวจ
          </button>
        </>
      ) : null}

      {showActivation ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="activation-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"
          >
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <LockKeyhole aria-hidden="true" size={29} />
            </span>
            <p className="mt-4 text-sm font-bold text-amber-700">ครบสิทธิ์ใช้ฟรี 10 แผ่น</p>
            <h2 id="activation-title" className="mt-1 text-2xl font-extrabold text-navy-900">
              Activate เพื่อสแกนต่อ
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              ข้อสอบและผลตรวจเดิมยังเปิดดูได้ตามปกติ การ Activate จะปลดจำกัดจำนวนแผ่นบนอุปกรณ์นี้
            </p>
            <Link
              to="/more"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-800 px-4 font-bold text-white hover:bg-navy-900"
            >
              <LockKeyhole aria-hidden="true" size={20} /> ไปหน้า Activate
            </Link>
            {!quotaReached ? (
              <button
                type="button"
                onClick={() => setShowActivation(false)}
                className="mt-2 min-h-12 w-full rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              >
                ปิด
              </button>
            ) : null}
          </section>
        </div>
      ) : null}

      {cameraOpen ? (
        <CameraCapture
          onCapture={(file) => {
            setCameraOpen(false);
            handleImage(file);
          }}
          onClose={() => setCameraOpen(false)}
        />
      ) : null}
    </div>
  );
}
