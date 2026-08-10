/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import type { Exam, ExamResult, MarkedAnswer } from '../../types/domain';

export interface ScoreSummary {
  readonly score: number;
  readonly maxScore: number;
  readonly needsReview: boolean;
}

export interface ExamStatistics {
  readonly submissionCount: number;
  readonly averageScore: number;
  readonly highestScore: number;
  readonly lowestScore: number;
  readonly pendingReviewCount: number;
}

export interface ItemStatistic {
  readonly questionId: string;
  readonly correctCount: number;
  readonly answeredCount: number;
  readonly correctPercentage: number;
}

export function scoreAnswers(exam: Exam, answers: readonly MarkedAnswer[]): ScoreSummary {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
  const maxScore = exam.questions.reduce((total, question) => total + question.points, 0);
  let score = 0;
  let needsReview = false;

  for (const question of exam.questions) {
    const answer = answerMap.get(question.id);
    if (!answer || answer.status !== 'confirmed') {
      if (answer?.status === 'ambiguous') needsReview = true;
      continue;
    }
    if (answer.choice === question.correctChoice) score += question.points;
  }

  return { score, maxScore, needsReview };
}

export function calculateExamStatistics(results: readonly ExamResult[]): ExamStatistics {
  if (results.length === 0) {
    return {
      submissionCount: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      pendingReviewCount: 0,
    };
  }

  const scores = results.map((result) => result.score);
  return {
    submissionCount: results.length,
    averageScore: scores.reduce((total, score) => total + score, 0) / results.length,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    pendingReviewCount: results.filter((result) => result.reviewStatus === 'needs-review').length,
  };
}

export function calculateItemStatistics(
  exam: Exam,
  results: readonly ExamResult[],
): readonly ItemStatistic[] {
  return exam.questions.map((question) => {
    let correctCount = 0;
    let answeredCount = 0;

    for (const result of results) {
      const answer = result.answers.find((item) => item.questionId === question.id);
      if (answer?.status !== 'confirmed' || answer.choice === null) continue;
      answeredCount += 1;
      if (answer.choice === question.correctChoice) correctCount += 1;
    }

    return {
      questionId: question.id,
      correctCount,
      answeredCount,
      correctPercentage: answeredCount === 0 ? 0 : (correctCount / answeredCount) * 100,
    };
  });
}
