/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { Printer } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { listExams } from '../../database/repository';
import { useStoredData } from '../../hooks/useStoredData';
import { isExamReadyForScanning, maxQuestionsPerAnswerSheet } from '../../lib/answerSheetLayout';
import type { Exam } from '../../types/domain';

const loadExams = () => listExams();
const choiceLabels = ['ก', 'ข', 'ค', 'ง', 'จ'];

export function AnswerSheetsPage() {
  const { data: exams, loading, error } = useStoredData(loadExams, [] as readonly Exam[]);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get('exam') ?? '';
  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === requestedId) ?? exams[0],
    [exams, requestedId],
  );
  const readyToPrint = selectedExam
    ? isExamReadyForScanning(selectedExam.questions.length, selectedExam.status)
    : false;

  function selectExam(examId: string): void {
    setSearchParams(examId ? { exam: examId } : {});
  }

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          eyebrow="กระดาษคำตอบ A4"
          title="พิมพ์กระดาษคำตอบ"
          description="แบบขาวดำ มีจุดอ้างอิงสี่มุมและช่องฝนตามจำนวนตัวเลือก พร้อมสำหรับพิมพ์หรือบันทึกเป็น PDF"
          icon={Printer}
          action={
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!readyToPrint}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 font-bold text-navy-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 disabled:opacity-50"
            >
              <Printer aria-hidden="true" size={20} /> พิมพ์ / บันทึก PDF
            </button>
          }
        />
      </div>

      {error ? (
        <p role="alert" className="no-print rounded-xl bg-rose-50 p-4 text-rose-700">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p role="status" className="no-print p-6 text-center">
          กำลังเตรียมกระดาษคำตอบ…
        </p>
      ) : null}

      {!loading && exams.length === 0 ? (
        <div className="no-print">
          <EmptyState
            title="ยังไม่มีข้อสอบสำหรับสร้างกระดาษคำตอบ"
            description="สร้างข้อสอบและกำหนดจำนวนตัวเลือกก่อน แล้วระบบจะจัดกระดาษคำตอบให้โดยอัตโนมัติ"
          />
        </div>
      ) : null}

      {selectedExam ? (
        <>
          <section className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">เลือกข้อสอบ</span>
              <select
                value={selectedExam.id}
                onChange={(event) => selectExam(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.questions.length} ข้อ)
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-3 text-sm leading-6 text-amber-800">
              ควรพิมพ์ที่ขนาด 100% และไม่เลือก “Fit to page” เพื่อรักษาสัดส่วนสำหรับการถ่ายภาพ
            </p>
            {selectedExam.status !== 'ready' ? (
              <p role="alert" className="mt-2 text-sm font-bold text-rose-700">
                ข้อสอบนี้ยังเป็นฉบับร่าง กรุณาตรวจข้อมูลและทำเครื่องหมายว่าพร้อมใช้ก่อนพิมพ์
              </p>
            ) : null}
            {selectedExam.questions.length > maxQuestionsPerAnswerSheet ? (
              <p role="alert" className="mt-2 text-sm font-bold text-rose-700">
                OMR รองรับสูงสุด {maxQuestionsPerAnswerSheet} ข้อต่อกระดาษหนึ่งแผ่น
                กรุณาแบ่งข้อสอบเป็นหลายชุด
              </p>
            ) : null}
          </section>

          <article className="print-sheet relative mx-auto min-h-[297mm] w-full max-w-[210mm] overflow-hidden bg-white p-5 text-black shadow-xl sm:p-8">
            <span className="sheet-marker left-3 top-3" aria-hidden="true" />
            <span className="sheet-marker right-3 top-3" aria-hidden="true" />
            <span className="sheet-marker bottom-3 left-3" aria-hidden="true" />
            <span className="sheet-marker bottom-3 right-3" aria-hidden="true" />

            <header className="sheet-header border-b-2 border-black pb-4 text-center">
              <p className="text-xs font-bold tracking-[0.25em]">SMARTEXAM ANSWER SHEET</p>
              <h2 className="mt-2 text-xl font-black sm:text-2xl">{selectedExam.title}</h2>
              <p className="mt-1 text-sm">
                {[selectedExam.subject, selectedExam.gradeLevel].filter(Boolean).join(' • ')}
              </p>
            </header>

            <div className="sheet-student mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p className="border-b border-black pb-1">รหัสผู้เข้าสอบ ____________________</p>
              <p className="border-b border-black pb-1">ห้อง / เลขที่ ____________________</p>
            </div>

            <div className="answer-grid mt-5 grid grid-cols-1 gap-x-7 gap-y-2 min-[480px]:grid-cols-2">
              {selectedExam.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="answer-row flex break-inside-avoid items-center gap-2 border-b border-dotted border-slate-400 py-1.5"
                >
                  <span className="w-7 shrink-0 text-right text-sm font-bold">{index + 1}.</span>
                  <div
                    className="answer-options grid flex-1 gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${question.choices.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {question.choices.map((_, choiceIndex) => (
                      <span
                        key={`${question.id}-${choiceIndex}`}
                        className="answer-choice flex items-center justify-center gap-1 text-xs"
                      >
                        <span className="choice-label">{choiceLabels[choiceIndex]}</span>
                        <span className="answer-bubble" aria-hidden="true" />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <footer className="mt-6 border-t border-black pt-3 text-center text-[10px] leading-4">
              <p>
                ใช้ดินสอ 2B หรือปากกาสีเข้ม ระบายคำตอบให้เต็มวง และหลีกเลี่ยงรอยพับบริเวณจุดสี่มุม
              </p>
              <p className="font-bold">
                เอกสารสร้างจาก SmartExam • ไม่บันทึกข้อมูลผู้เข้าสอบลงบนระบบโดยอัตโนมัติ
              </p>
            </footer>
          </article>
        </>
      ) : null}
    </div>
  );
}
