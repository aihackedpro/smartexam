/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import {
  AlertTriangle,
  BarChart3,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Download,
  Save,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { deleteResult, listExams, listResults, saveResult } from '../../database/repository';
import { useStoredData } from '../../hooks/useStoredData';
import type { Exam, ExamResult } from '../../types/domain';
import { calculateExamStatistics, calculateItemStatistics, scoreAnswers } from './scoring';

const loadExams = () => listExams();
const loadResults = () => listResults();
const choiceLabels = ['ก', 'ข', 'ค', 'ง', 'จ'];

function downloadCsv(exam: Exam, results: readonly ExamResult[]): void {
  const header = ['รหัสผู้เข้าสอบ', 'คะแนน', 'คะแนนเต็ม', 'สถานะตรวจทาน', 'วันที่บันทึก'];
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = results.map((result) => [
    result.examineeCode,
    result.score,
    result.maxScore,
    result.reviewStatus === 'complete' ? 'ตรวจครบแล้ว' : 'รอตรวจ',
    new Date(result.updatedAt).toLocaleString('th-TH'),
  ]);
  const csv = `\uFEFF${[header, ...rows].map((row) => row.map(escape).join(',')).join('\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${exam.title.replaceAll(/[^\p{L}\p{N}-]+/gu, '-')}-results.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

interface ResultReviewProps {
  readonly result: ExamResult;
  readonly exam: Exam;
  readonly onClose: () => void;
}

function ResultReview({ result, exam, onClose }: ResultReviewProps) {
  const [answers, setAnswers] = useState(result.answers);
  const [message, setMessage] = useState('');

  function updateAnswer(questionId: string, choice: number | null): void {
    setAnswers((current) =>
      current.map((answer) =>
        answer.questionId === questionId
          ? {
              ...answer,
              choice,
              status: choice === null ? 'unanswered' : 'confirmed',
              confidence: choice === null ? null : 1,
            }
          : answer,
      ),
    );
  }

  async function handleSave(): Promise<void> {
    const summary = scoreAnswers(exam, answers);
    await saveResult({
      ...result,
      answers,
      score: summary.score,
      maxScore: summary.maxScore,
      reviewStatus: answers.some((answer) => answer.status === 'ambiguous')
        ? 'needs-review'
        : 'complete',
    });
    setMessage('บันทึกการตรวจทานและคำนวณคะแนนใหม่แล้ว');
  }

  return (
    <section className="rounded-3xl border-2 border-amber-300 bg-white p-4 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-amber-700">ตรวจทานผล</p>
          <h2 className="text-xl font-extrabold text-navy-900">รหัส {result.examineeCode}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-xl px-4 font-bold text-slate-700 hover:bg-slate-100"
        >
          ปิด
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {exam.questions.map((question, index) => {
          const answer = answers.find((item) => item.questionId === question.id);
          return (
            <article key={question.id} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-navy-900">ข้อ {index + 1}</p>
                {answer?.status === 'ambiguous' ? (
                  <StatusBadge tone="warning">กำกวม</StatusBadge>
                ) : null}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 min-[420px]:grid-cols-5">
                {question.choices.map((_, choiceIndex) => (
                  <button
                    key={`${question.id}-${choiceIndex}`}
                    type="button"
                    aria-pressed={answer?.status === 'confirmed' && answer.choice === choiceIndex}
                    onClick={() => updateAnswer(question.id, choiceIndex)}
                    className={`min-h-12 rounded-xl border font-bold ${
                      answer?.status === 'confirmed' && answer.choice === choiceIndex
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white text-navy-900'
                    }`}
                  >
                    {choiceLabels[choiceIndex]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => updateAnswer(question.id, null)}
                className="mt-2 min-h-12 w-full rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                ยืนยันว่าเว้นว่าง
              </button>
            </article>
          );
        })}
      </div>

      {message ? (
        <p
          role="status"
          className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800"
        >
          {message}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void handleSave()}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-bold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
      >
        <Save aria-hidden="true" size={20} /> บันทึกการตรวจทาน
      </button>
    </section>
  );
}

export function ResultsPage() {
  const { data: exams, loading: examsLoading } = useStoredData(loadExams, [] as readonly Exam[]);
  const { data: allResults, loading: resultsLoading } = useStoredData(
    loadResults,
    [] as readonly ExamResult[],
  );
  const [examId, setExamId] = useState('');
  const [reviewingResult, setReviewingResult] = useState<ExamResult | null>(null);
  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === examId) ?? exams[0],
    [examId, exams],
  );
  const results = useMemo(
    () => allResults.filter((result) => result.examId === selectedExam?.id),
    [allResults, selectedExam?.id],
  );
  const statistics = useMemo(() => calculateExamStatistics(results), [results]);
  const itemStatistics = useMemo(
    () => (selectedExam ? calculateItemStatistics(selectedExam, results) : []),
    [results, selectedExam],
  );

  async function handleDelete(result: ExamResult): Promise<void> {
    if (!window.confirm(`ลบผลตรวจรหัส “${result.examineeCode}” หรือไม่?`)) return;
    await deleteResult(result.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="วิเคราะห์คะแนนในเครื่อง"
        title="รายงานผล"
        description="สรุปคะแนน ติดตามรายการรอตรวจ วิเคราะห์รายข้อ และส่งออก CSV โดยไม่ส่งข้อมูลออกจากอุปกรณ์"
        icon={ChartNoAxesColumnIncreasing}
      />

      {examsLoading || resultsLoading ? (
        <p role="status" className="p-6 text-center">
          กำลังคำนวณรายงาน…
        </p>
      ) : null}
      {!examsLoading && exams.length === 0 ? (
        <EmptyState
          title="ยังไม่มีรายงาน"
          description="สร้างข้อสอบและบันทึกผลตรวจอย่างน้อยหนึ่งรายการเพื่อดูรายงาน"
        />
      ) : null}

      {selectedExam ? (
        <>
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-end sm:justify-between">
            <label className="flex-1">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">ข้อสอบ</span>
              <select
                value={selectedExam.id}
                onChange={(event) => {
                  setExamId(event.target.value);
                  setReviewingResult(null);
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
            <button
              type="button"
              disabled={results.length === 0}
              onClick={() => downloadCsv(selectedExam, results)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-navy-800 px-4 font-bold text-navy-900 hover:bg-navy-50 disabled:opacity-40"
            >
              <Download aria-hidden="true" size={19} /> ส่งออก CSV
            </button>
          </section>

          <section aria-label="สรุปคะแนน" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ['ผู้เข้าสอบ', statistics.submissionCount.toString()],
              ['คะแนนเฉลี่ย', statistics.averageScore.toFixed(1)],
              ['สูงสุด', statistics.highestScore.toFixed(1)],
              ['ต่ำสุด', statistics.lowestScore.toFixed(1)],
              ['รอตรวจ', statistics.pendingReviewCount.toString()],
            ].map(([label, value], index) => (
              <article
                key={label}
                className={`rounded-2xl border p-4 ${index === 4 && statistics.pendingReviewCount ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}
              >
                <p className="text-xs font-bold text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-black text-navy-900">{value}</p>
              </article>
            ))}
          </section>

          {reviewingResult ? (
            <ResultReview
              result={reviewingResult}
              exam={selectedExam}
              onClose={() => setReviewingResult(null)}
            />
          ) : null}

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
            <div className="flex items-center gap-3">
              <BarChart3 aria-hidden="true" className="text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">ความยากรายข้อ</p>
                <h2 className="text-xl font-extrabold text-navy-900">ตอบถูกแต่ละข้อ</h2>
              </div>
            </div>
            {results.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-600">
                ยังไม่มีผลตรวจสำหรับข้อสอบนี้
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {itemStatistics.map((item, index) => (
                  <div
                    key={item.questionId}
                    className="grid grid-cols-[3rem_1fr_4rem] items-center gap-2 text-sm"
                  >
                    <span className="font-bold text-navy-900">ข้อ {index + 1}</span>
                    <span className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <span
                        className="block h-full rounded-full bg-emerald-600"
                        style={{ width: `${item.correctPercentage}%` }}
                      />
                    </span>
                    <span className="text-right font-bold text-slate-700">
                      {item.correctPercentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="result-list-heading" className="space-y-3">
            <h2 id="result-list-heading" className="text-xl font-extrabold text-navy-900">
              รายการผลตรวจ
            </h2>
            {results.map((result) => (
              <article
                key={result.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-navy-900">รหัส {result.examineeCode}</p>
                    <StatusBadge tone={result.reviewStatus === 'complete' ? 'success' : 'warning'}>
                      {result.reviewStatus === 'complete' ? 'ตรวจครบแล้ว' : 'รอตรวจ'}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    บันทึก {new Date(result.updatedAt).toLocaleString('th-TH')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="mr-auto text-xl font-black text-navy-900 sm:mr-2">
                    {result.score}/{result.maxScore}
                  </p>
                  <button
                    type="button"
                    onClick={() => setReviewingResult(result)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-navy-50 px-3 text-sm font-bold text-navy-900 hover:bg-navy-100"
                  >
                    {result.reviewStatus === 'needs-review' ? (
                      <AlertTriangle aria-hidden="true" size={18} />
                    ) : (
                      <CheckCircle2 aria-hidden="true" size={18} />
                    )}
                    ตรวจทาน
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(result)}
                    aria-label={`ลบผลตรวจ ${result.examineeCode}`}
                    className="grid size-12 place-items-center rounded-xl text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 aria-hidden="true" size={19} />
                  </button>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}
