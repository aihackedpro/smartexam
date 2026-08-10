/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import {
  ArrowLeft,
  CheckCircle2,
  ClipboardPlus,
  Copy,
  FilePenLine,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { deleteExam, listExams, parseExamRecord, saveExam } from '../../database/repository';
import { useStoredData } from '../../hooks/useStoredData';
import type { Exam, Question } from '../../types/domain';
import { createExam, createQuestion, validateExam } from './examDomain';

const fieldClass =
  'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';
const primaryButton =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-bold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50';

const loadExams = () => listExams();

function updateQuestion(
  exam: Exam,
  questionId: string,
  updater: (value: Question) => Question,
): Exam {
  return {
    ...exam,
    status: 'draft',
    questions: exam.questions.map((question) =>
      question.id === questionId ? updater(question) : question,
    ),
  };
}

function contentSignature(exam: Exam): string {
  return JSON.stringify({
    title: exam.title,
    subject: exam.subject,
    gradeLevel: exam.gradeLevel,
    description: exam.description,
    status: exam.status,
    questions: exam.questions,
  });
}

function recoverExamDraft(exam: Exam): Exam {
  try {
    const source = localStorage.getItem(`smartexam:draft:${exam.id}`);
    if (!source) return exam;
    const parsed: unknown = JSON.parse(source);
    const recovered = parseExamRecord(parsed);
    if (recovered?.id === exam.id) return recovered;
  } catch {
    try {
      localStorage.removeItem(`smartexam:draft:${exam.id}`);
    } catch {
      // Ignore unavailable browser storage; IndexedDB remains the primary store.
    }
  }
  return exam;
}

interface ExamEditorProps {
  readonly exam: Exam;
  readonly onClose: () => void;
}

function ExamEditor({ exam, onClose }: ExamEditorProps) {
  const [draft, setDraft] = useState(() => recoverExamDraft(exam));
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [message, setMessage] = useState('');
  const savedSignature = useRef(contentSignature(exam));
  const issues = useMemo(() => validateExam(draft), [draft]);

  useEffect(() => {
    const signature = contentSignature(draft);
    if (signature === savedSignature.current) return;
    setSaveState('saving');
    try {
      localStorage.setItem(`smartexam:draft:${draft.id}`, JSON.stringify(draft));
    } catch {
      // IndexedDB autosave below remains the authoritative recovery path.
    }
    const timer = window.setTimeout(() => {
      saveExam(draft)
        .then((saved) => {
          savedSignature.current = contentSignature(saved);
          localStorage.removeItem(`smartexam:draft:${saved.id}`);
          setDraft(saved);
          setSaveState('saved');
        })
        .catch(() => setSaveState('error'));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draft]);

  async function handleSave(): Promise<void> {
    setSaveState('saving');
    try {
      const saved = await saveExam(draft);
      savedSignature.current = contentSignature(saved);
      setDraft(saved);
      setSaveState('saved');
      setMessage('บันทึกข้อสอบในเครื่องแล้ว');
    } catch {
      setSaveState('error');
      setMessage('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง');
    }
  }

  function addQuestion(): void {
    setDraft((current) => ({
      ...current,
      questions: [...current.questions, createQuestion(current.questions.length + 1)],
    }));
  }

  function duplicateQuestion(question: Question): void {
    const copy = { ...question, id: createQuestion(draft.questions.length + 1).id };
    setDraft((current) => ({ ...current, questions: [...current.questions, copy] }));
  }

  function removeQuestion(questionId: string): void {
    setDraft((current) => ({
      ...current,
      questions: current.questions.filter((question) => question.id !== questionId),
    }));
  }

  function setReady(): void {
    if (issues.length > 0) {
      setMessage(issues[0]?.message ?? 'กรุณาตรวจข้อมูลข้อสอบ');
      return;
    }
    setDraft((current) => ({ ...current, status: 'ready' }));
    setMessage('ข้อสอบพร้อมใช้สำหรับพิมพ์และตรวจแล้ว');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 font-semibold text-navy-800 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
        >
          <ArrowLeft aria-hidden="true" size={20} /> กลับคลังข้อสอบ
        </button>
        <div className="flex items-center gap-2">
          <StatusBadge
            tone={saveState === 'error' ? 'danger' : saveState === 'saved' ? 'success' : 'warning'}
          >
            {saveState === 'saved'
              ? 'บันทึกแล้ว'
              : saveState === 'saving'
                ? 'กำลังบันทึก…'
                : 'บันทึกไม่สำเร็จ'}
          </StatusBadge>
          <button type="button" onClick={() => void handleSave()} className={primaryButton}>
            <Save aria-hidden="true" size={19} /> บันทึก
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">ชื่อข้อสอบ *</span>
            <input
              className={fieldClass}
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value, status: 'draft' })
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-bold text-slate-700">รายวิชา</span>
            <input
              className={fieldClass}
              value={draft.subject}
              onChange={(event) =>
                setDraft({ ...draft, subject: event.target.value, status: 'draft' })
              }
              placeholder="เช่น วิทยาศาสตร์"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-bold text-slate-700">ระดับชั้น</span>
            <input
              className={fieldClass}
              value={draft.gradeLevel}
              onChange={(event) =>
                setDraft({ ...draft, gradeLevel: event.target.value, status: 'draft' })
              }
              placeholder="เช่น ม.2"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">คำชี้แจง</span>
            <textarea
              className={`${fieldClass} min-h-24 resize-y`}
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value, status: 'draft' })
              }
              placeholder="คำแนะนำสำหรับผู้เข้าสอบ"
            />
          </label>
        </div>
      </section>

      <section aria-labelledby="questions-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-700">แบบปรนัย</p>
            <h2 id="questions-heading" className="text-xl font-extrabold text-navy-900">
              คำถาม {draft.questions.length} ข้อ
            </h2>
          </div>
          <button type="button" onClick={addQuestion} className={primaryButton}>
            <Plus aria-hidden="true" size={20} /> เพิ่มข้อ
          </button>
        </div>

        {draft.questions.map((question, questionIndex) => (
          <article
            key={question.id}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-navy-900">ข้อ {questionIndex + 1}</h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => duplicateQuestion(question)}
                  aria-label={`ทำสำเนาข้อ ${questionIndex + 1}`}
                  className="grid size-12 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  <Copy aria-hidden="true" size={19} />
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  aria-label={`ลบข้อ ${questionIndex + 1}`}
                  className="grid size-12 place-items-center rounded-xl text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
                >
                  <Trash2 aria-hidden="true" size={19} />
                </button>
              </div>
            </div>

            <label className="mt-3 block">
              <span className="sr-only">คำถามข้อ {questionIndex + 1}</span>
              <textarea
                className={`${fieldClass} min-h-20 resize-y font-medium`}
                value={question.prompt}
                onChange={(event) =>
                  setDraft(
                    updateQuestion(draft, question.id, (current) => ({
                      ...current,
                      prompt: event.target.value,
                    })),
                  )
                }
              />
            </label>

            <fieldset className="mt-4 space-y-3">
              <legend className="text-sm font-bold text-slate-700">ตัวเลือกและเฉลย</legend>
              {question.choices.map((choice, choiceIndex) => (
                <div key={`${question.id}-${choiceIndex}`} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`answer-${question.id}`}
                    checked={question.correctChoice === choiceIndex}
                    onChange={() =>
                      setDraft(
                        updateQuestion(draft, question.id, (current) => ({
                          ...current,
                          correctChoice: choiceIndex,
                        })),
                      )
                    }
                    aria-label={`กำหนดตัวเลือก ${choiceIndex + 1} เป็นเฉลยข้อ ${questionIndex + 1}`}
                    className="size-6 shrink-0 accent-emerald-600"
                  />
                  <input
                    className={fieldClass}
                    value={choice}
                    aria-label={`ตัวเลือก ${choiceIndex + 1} ของข้อ ${questionIndex + 1}`}
                    onChange={(event) =>
                      setDraft(
                        updateQuestion(draft, question.id, (current) => ({
                          ...current,
                          choices: current.choices.map((value, index) =>
                            index === choiceIndex ? event.target.value : value,
                          ),
                        })),
                      )
                    }
                  />
                  {question.choices.length > 2 ? (
                    <button
                      type="button"
                      aria-label={`ลบตัวเลือก ${choiceIndex + 1}`}
                      onClick={() =>
                        setDraft(
                          updateQuestion(draft, question.id, (current) => {
                            const choices = current.choices.filter(
                              (_, index) => index !== choiceIndex,
                            );
                            return {
                              ...current,
                              choices,
                              correctChoice: Math.min(current.correctChoice, choices.length - 1),
                            };
                          }),
                        )
                      }
                      className="grid size-12 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </button>
                  ) : null}
                </div>
              ))}
            </fieldset>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={question.choices.length >= 5}
                onClick={() =>
                  setDraft(
                    updateQuestion(draft, question.id, (current) => ({
                      ...current,
                      choices: [...current.choices, `ตัวเลือก ${current.choices.length + 1}`],
                    })),
                  )
                }
                className="min-h-12 rounded-xl px-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
              >
                + เพิ่มตัวเลือก
              </button>
              <label className="flex min-h-12 items-center gap-2 text-sm font-bold text-slate-700">
                คะแนน
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={question.points}
                  onChange={(event) =>
                    setDraft(
                      updateQuestion(draft, question.id, (current) => ({
                        ...current,
                        points: Number(event.target.value),
                      })),
                    )
                  }
                  className="min-h-12 w-24 rounded-xl border border-slate-300 px-3 text-center"
                />
              </label>
            </div>
          </article>
        ))}
      </section>

      {issues.length > 0 ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p className="font-bold">ต้องตรวจอีก {issues.length} รายการ</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {issues.slice(0, 4).map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? (
        <p role="status" className="text-sm font-semibold text-navy-800">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-navy-900">สถานะข้อสอบ</p>
          <p className="text-sm text-slate-600">
            {draft.status === 'ready' ? 'พร้อมพิมพ์และใช้ตรวจ' : 'ฉบับร่าง ยังแก้ไขได้'}
          </p>
        </div>
        <button type="button" onClick={setReady} className={primaryButton}>
          <CheckCircle2 aria-hidden="true" size={20} /> ทำเครื่องหมายว่าพร้อมใช้
        </button>
      </div>
    </div>
  );
}

export function ExamsPage() {
  const { data: exams, loading, error } = useStoredData(loadExams, [] as readonly Exam[]);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  async function startNewExam(): Promise<void> {
    const saved = await saveExam(createExam());
    setEditingExam(saved);
  }

  async function handleDelete(exam: Exam): Promise<void> {
    if (!window.confirm(`ลบ “${exam.title}” และผลตรวจทั้งหมดของข้อสอบนี้หรือไม่?`)) return;
    await deleteExam(exam.id);
  }

  if (editingExam) return <ExamEditor exam={editingExam} onClose={() => setEditingExam(null)} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="คลังข้อสอบในเครื่อง"
        title="สร้างข้อสอบ"
        description="สร้างชุดข้อสอบแบบปรนัย กำหนดเฉลยและคะแนน ระบบบันทึกอัตโนมัติในอุปกรณ์นี้"
        icon={ClipboardPlus}
        action={
          <button type="button" onClick={() => void startNewExam()} className={primaryButton}>
            <Plus aria-hidden="true" size={20} /> สร้างข้อสอบใหม่
          </button>
        }
      />

      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p role="status" className="p-6 text-center text-slate-600">
          กำลังเปิดคลังข้อสอบ…
        </p>
      ) : null}

      {!loading && exams.length === 0 ? (
        <EmptyState
          title="ยังไม่มีข้อสอบในเครื่องนี้"
          description="เริ่มสร้างข้อสอบชุดแรก ข้อมูลจะถูกบันทึกไว้ในเครื่องและใช้งานต่อได้แม้ไม่มีอินเทอร์เน็ต"
          action={
            <button type="button" onClick={() => void startNewExam()} className={primaryButton}>
              <Plus aria-hidden="true" size={20} /> สร้างข้อสอบแรก
            </button>
          }
        />
      ) : null}

      <section aria-label="รายการข้อสอบ" className="grid gap-4 md:grid-cols-2">
        {exams.map((exam) => (
          <article
            key={exam.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-800">
                <FilePenLine aria-hidden="true" size={25} />
              </span>
              <StatusBadge tone={exam.status === 'ready' ? 'success' : 'warning'}>
                {exam.status === 'ready' ? 'พร้อมใช้' : 'ฉบับร่าง'}
              </StatusBadge>
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-navy-900">{exam.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {[exam.subject, exam.gradeLevel].filter(Boolean).join(' • ') ||
                'ยังไม่ระบุรายวิชาและชั้น'}
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {exam.questions.length} ข้อ •{' '}
              {exam.questions.reduce((sum, item) => sum + item.points, 0)} คะแนน
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setEditingExam(exam)} className={primaryButton}>
                <FilePenLine aria-hidden="true" size={18} /> แก้ไข
              </button>
              <Link
                to={`/answer-sheets?exam=${encodeURIComponent(exam.id)}`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-3 text-sm font-bold text-navy-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
              >
                พิมพ์คำตอบ
              </Link>
            </div>
            <button
              type="button"
              onClick={() => void handleDelete(exam)}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
            >
              <Trash2 aria-hidden="true" size={18} /> ลบข้อสอบ
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
