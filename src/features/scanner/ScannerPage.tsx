/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { AlertTriangle, Camera, Check, RotateCcw, Save, ScanLine } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { listExams, saveResult } from '../../database/repository';
import { useStoredData } from '../../hooks/useStoredData';
import { createId } from '../../lib/identifiers';
import type { Exam, MarkedAnswer } from '../../types/domain';
import { scoreAnswers } from '../results/scoring';

const loadExams = () => listExams();
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
  const [examId, setExamId] = useState('');
  const [examineeCode, setExamineeCode] = useState('');
  const [answers, setAnswers] = useState<readonly MarkedAnswer[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === examId) ?? exams[0],
    [examId, exams],
  );

  useEffect(
    () => () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    },
    [imageUrl],
  );

  function handleImage(file: File | undefined): void {
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setMessage('แนบภาพแล้ว กรุณาเทียบภาพและยืนยันคำตอบทีละข้อ');
  }

  function updateAnswer(questionId: string, update: Partial<MarkedAnswer>): void {
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
    if (!selectedExam) return;
    const currentAnswers =
      answers.length === selectedExam.questions.length ? answers : createBlankAnswers(selectedExam);
    const summary = scoreAnswers(selectedExam, currentAnswers);
    const timestamp = new Date().toISOString();
    const needsReview = currentAnswers.some((answer) => answer.status === 'ambiguous');
    await saveResult({
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
        ? `บันทึกคะแนน ${summary.score}/${summary.maxScore} และส่งรายการกำกวมไปรอตรวจแล้ว`
        : `บันทึกผลเรียบร้อย คะแนน ${summary.score}/${summary.maxScore}`,
    );
    setExamineeCode('');
    setAnswers(createBlankAnswers(selectedExam));
  }

  const currentAnswers =
    selectedExam && answers.length === selectedExam.questions.length
      ? answers
      : selectedExam
        ? createBlankAnswers(selectedExam)
        : [];
  const ambiguousCount = currentAnswers.filter((answer) => answer.status === 'ambiguous').length;
  const confirmedCount = currentAnswers.filter((answer) => answer.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ตรวจด้วยมือถืออย่างปลอดภัย"
        title="สแกนตรวจ"
        description="ถ่ายหรือเลือกภาพกระดาษคำตอบ แล้วเทียบภาพเพื่อยืนยันคำตอบ ระบบจะไม่เดาคำตอบที่ไม่ชัดเจน"
        icon={ScanLine}
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="flex items-start gap-2 font-bold">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
          โหมดช่วยตรวจแบบครูยืนยัน
        </p>
        <p className="mt-1 pl-7">
          ภาพใช้แสดงชั่วคราวบนหน้าจอนี้และไม่ถูกเก็บในฐานข้อมูล หากช่องใดอ่านไม่ชัดให้กด “รอตรวจ”
        </p>
      </div>

      {loading ? (
        <p role="status" className="p-6 text-center">
          กำลังเปิดรายการข้อสอบ…
        </p>
      ) : null}
      {!loading && exams.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          กรุณาสร้างข้อสอบและเฉลยก่อนเริ่มตรวจ
        </p>
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
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">ภาพกระดาษคำตอบ</span>
              <span className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 font-bold text-emerald-800 hover:bg-emerald-100">
                <Camera aria-hidden="true" size={22} /> ถ่ายภาพหรือเลือกจากเครื่อง
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => handleImage(event.target.files?.[0])}
                />
              </span>
            </label>
          </section>

          {imageUrl ? (
            <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-2 shadow-soft">
              <img
                src={imageUrl}
                alt="ภาพกระดาษคำตอบสำหรับเทียบคำตอบ"
                className="mx-auto max-h-[60vh] rounded-2xl object-contain"
              />
              <figcaption className="p-2 text-center text-xs text-white">
                ภาพนี้จะไม่ถูกบันทึกเมื่อออกจากหน้า
              </figcaption>
            </figure>
          ) : null}

          <section aria-labelledby="review-heading" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-700">ยืนยันผลอ่าน</p>
                <h2 id="review-heading" className="text-xl font-extrabold text-navy-900">
                  คำตอบ {selectedExam.questions.length} ข้อ
                </h2>
              </div>
              <div className="flex gap-2">
                <StatusBadge tone="success">ยืนยัน {confirmedCount}</StatusBadge>
                <StatusBadge tone={ambiguousCount ? 'warning' : 'neutral'}>
                  รอตรวจ {ambiguousCount}
                </StatusBadge>
              </div>
            </div>

            {selectedExam.questions.map((question, index) => {
              const answer = currentAnswers.find((item) => item.questionId === question.id);
              return (
                <article
                  key={question.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
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
                        ? 'รอตรวจ'
                        : answer?.status === 'confirmed'
                          ? 'ยืนยันแล้ว'
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
                          confidence: null,
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

          {message ? (
            <p role="status" className="rounded-xl bg-navy-50 p-4 font-semibold text-navy-900">
              {message}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSave()}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-lg font-extrabold text-white shadow-emerald transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
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
    </div>
  );
}
