/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

export type SyncState = 'local' | 'pending' | 'synced' | 'conflict';
export type ExamStatus = 'draft' | 'ready';
export type ReviewStatus = 'complete' | 'needs-review';
export type AnswerStatus = 'confirmed' | 'ambiguous' | 'unanswered';

export interface Question {
  readonly id: string;
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly correctChoice: number;
  readonly points: number;
}

export interface Exam {
  readonly id: string;
  readonly title: string;
  readonly subject: string;
  readonly gradeLevel: string;
  readonly description: string;
  readonly status: ExamStatus;
  readonly questions: readonly Question[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revision: number;
  readonly syncState: SyncState;
}

export interface MarkedAnswer {
  readonly questionId: string;
  readonly choice: number | null;
  readonly status: AnswerStatus;
  readonly confidence: number | null;
}

export interface ExamResult {
  readonly id: string;
  readonly examId: string;
  readonly examineeCode: string;
  readonly answers: readonly MarkedAnswer[];
  readonly score: number;
  readonly maxScore: number;
  readonly reviewStatus: ReviewStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revision: number;
  readonly syncState: SyncState;
}

export interface AppSettings {
  readonly id: 'app';
  readonly schoolName: string;
  readonly teacherName: string;
  readonly scanUsageCount: number;
  readonly updatedAt: string;
}

export type LicensePlan = 'month' | 'year' | 'lifetime';

export interface LicenseClaims {
  readonly version: 2;
  readonly app: 'smartexam';
  readonly keyId: string;
  readonly licenseId: string;
  readonly deviceHash: string;
  readonly plan: LicensePlan;
  readonly issuedAt: string;
  readonly expiresAt: string | null;
}

export interface DeviceIdentityRecord {
  readonly id: 'device';
  readonly publicKey: JsonWebKey;
  readonly privateKey: CryptoKey;
  readonly fingerprint: string;
  readonly deviceCode: string;
  readonly createdAt: string;
}

export interface LicenseRecord {
  readonly id: 'license';
  readonly token: string;
  readonly claims: LicenseClaims;
  readonly activatedAt: string;
  readonly lastTrustedAt: string;
  readonly updatedAt: string;
}

export interface BackupSettings {
  readonly schoolName: string;
  readonly teacherName: string;
}

export interface SmartExamBackup {
  readonly format: 'smartexam-backup';
  readonly version: 2;
  readonly exportedAt: string;
  readonly exams: readonly Exam[];
  readonly results: readonly ExamResult[];
  readonly settings: BackupSettings;
}
