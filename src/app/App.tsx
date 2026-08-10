/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

const ExamsPage = lazy(() =>
  import('../features/exams/ExamsPage').then((module) => ({ default: module.ExamsPage })),
);
const AnswerSheetsPage = lazy(() =>
  import('../features/answer-sheets/AnswerSheetsPage').then((module) => ({
    default: module.AnswerSheetsPage,
  })),
);
const ScannerPage = lazy(() =>
  import('../features/scanner/ScannerPage').then((module) => ({ default: module.ScannerPage })),
);
const ResultsPage = lazy(() =>
  import('../features/results/ResultsPage').then((module) => ({ default: module.ResultsPage })),
);
const MorePage = lazy(() =>
  import('./pages/MorePage').then((module) => ({ default: module.MorePage })),
);

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8 text-center font-bold text-navy-900">
          กำลังเปิดหน้านี้…
        </p>
      }
    >
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="answer-sheets" element={<AnswerSheetsPage />} />
          <Route path="scanner" element={<ScannerPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
