/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

export const maxQuestionsPerAnswerSheet = 60;

export function isExamReadyForScanning(questionCount: number, status: 'draft' | 'ready'): boolean {
  return status === 'ready' && questionCount > 0 && questionCount <= maxQuestionsPerAnswerSheet;
}
