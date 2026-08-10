/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { database } from '../src/database/database';
import {
  createBackup,
  deleteExam,
  listExams,
  listResults,
  restoreBackup,
  saveExam,
  saveResult,
} from '../src/database/repository';
import { createExam } from '../src/features/exams/examDomain';

describe('การบันทึกข้อมูล local-first', () => {
  beforeEach(async () => {
    await database.delete();
    await database.open();
  });

  afterEach(async () => {
    await database.delete();
  });

  it('บันทึกข้อสอบพร้อม revision และเปิดอ่านกลับได้', async () => {
    const saved = await saveExam({ ...createExam(), title: 'ชุดทดสอบในเครื่อง' });
    const exams = await listExams();

    expect(saved.revision).toBe(1);
    expect(saved.syncState).toBe('pending');
    expect(exams).toHaveLength(1);
    expect(exams[0]?.title).toBe('ชุดทดสอบในเครื่อง');
  });

  it('ลบผลตรวจที่เกี่ยวข้องแบบ transaction เมื่อลบข้อสอบ', async () => {
    const exam = await saveExam(createExam());
    const timestamp = new Date().toISOString();
    await saveResult({
      id: 'result-test',
      examId: exam.id,
      examineeCode: 'TEST-01',
      answers: [],
      score: 0,
      maxScore: 1,
      reviewStatus: 'complete',
      createdAt: timestamp,
      updatedAt: timestamp,
      revision: 0,
      syncState: 'local',
    });

    await deleteExam(exam.id);

    await expect(listExams()).resolves.toHaveLength(0);
    await expect(listResults()).resolves.toHaveLength(0);
  });

  it('สำรองและกู้คืนข้อมูลได้โดยไม่สร้างรายการซ้ำ', async () => {
    const exam = await saveExam({ ...createExam(), title: 'ชุดสำรอง' });
    const backup = await createBackup();
    await deleteExam(exam.id);

    await restoreBackup(JSON.stringify(backup));
    await restoreBackup(JSON.stringify(backup));

    const restored = await listExams();
    expect(restored).toHaveLength(1);
    expect(restored[0]?.id).toBe(exam.id);
  });

  it('ไม่เปลี่ยนข้อมูลเมื่อไฟล์สำรองไม่ผ่าน validation', async () => {
    await saveExam({ ...createExam(), title: 'ห้ามหาย' });

    await expect(restoreBackup('{"format":"unknown"}')).rejects.toBeTruthy();
    const exams = await listExams();
    expect(exams[0]?.title).toBe('ห้ามหาย');
  });
});
