/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { AnswerSheetsPage } from '../features/answer-sheets/AnswerSheetsPage';
import { ExamsPage } from '../features/exams/ExamsPage';
import { ResultsPage } from '../features/results/ResultsPage';
import { ScannerPage } from '../features/scanner/ScannerPage';
import { HomePage } from './pages/HomePage';
import { MorePage } from './pages/MorePage';
import { NotFoundPage } from './pages/NotFoundPage';

export function AppRoutes() {
  return (
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
  );
}
