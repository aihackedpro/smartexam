/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { describe, expect, it } from 'vitest';
import { createExam, createQuestion } from '../src/features/exams/examDomain';
import {
  analyzeImageData,
  classifyFillScores,
  templateBubblePosition,
  type OmrPixelData,
} from '../src/features/scanner/omr';

interface TestPoint {
  readonly x: number;
  readonly y: number;
}

function createWhiteImage(width: number, height: number): OmrPixelData {
  const data = new Uint8ClampedArray(width * height * 4);
  data.fill(255);
  return { data, width, height };
}

function drawDarkPixel(image: OmrPixelData, x: number, y: number): void {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const offset = (y * image.width + x) * 4;
  image.data[offset] = 0;
  image.data[offset + 1] = 0;
  image.data[offset + 2] = 0;
  image.data[offset + 3] = 255;
}

function drawSquare(image: OmrPixelData, center: TestPoint, side: number): void {
  const startX = Math.round(center.x - side / 2);
  const startY = Math.round(center.y - side / 2);
  for (let y = startY; y < startY + side; y += 1) {
    for (let x = startX; x < startX + side; x += 1) drawDarkPixel(image, x, y);
  }
}

function drawDisc(image: OmrPixelData, center: TestPoint, radius: number): void {
  for (let y = Math.floor(center.y - radius); y <= Math.ceil(center.y + radius); y += 1) {
    for (let x = Math.floor(center.x - radius); x <= Math.ceil(center.x + radius); x += 1) {
      const deltaX = x - center.x;
      const deltaY = y - center.y;
      if (deltaX * deltaX + deltaY * deltaY <= radius * radius) {
        drawDarkPixel(image, x, y);
      }
    }
  }
}

function interpolateTestMarkers(
  markers: readonly [TestPoint, TestPoint, TestPoint, TestPoint],
  position: TestPoint,
): TestPoint {
  const [topLeft, topRight, bottomLeft, bottomRight] = markers;
  const topX = topLeft.x + (topRight.x - topLeft.x) * position.x;
  const topY = topLeft.y + (topRight.y - topLeft.y) * position.x;
  const bottomX = bottomLeft.x + (bottomRight.x - bottomLeft.x) * position.x;
  const bottomY = bottomLeft.y + (bottomRight.y - bottomLeft.y) * position.x;
  return {
    x: topX + (bottomX - topX) * position.y,
    y: topY + (bottomY - topY) * position.y,
  };
}

describe('การตีความวงคำตอบ OMR', () => {
  it('อ่านวงที่เข้มและแยกจากตัวเลือกอื่นเป็นคำตอบยืนยัน', () => {
    const result = classifyFillScores([0.05, 0.62, 0.07, 0.04]);

    expect(result.status).toBe('confirmed');
    expect(result.choice).toBe(1);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('ไม่เดาเมื่อมีการระบายสองวงใกล้เคียงกัน', () => {
    const result = classifyFillScores([0.48, 0.45, 0.05, 0.04]);

    expect(result.status).toBe('ambiguous');
    expect(result.choice).toBeNull();
  });

  it('อ่านข้อที่ไม่ระบายเป็นคำตอบว่าง', () => {
    expect(classifyFillScores([0.04, 0.06, 0.03, 0.05]).status).toBe('unanswered');
  });

  it('คำนวณตำแหน่งสองคอลัมน์และสามสิบแถวตาม template', () => {
    const first = templateBubblePosition(0, 0, 4);
    const nextRow = templateBubblePosition(1, 0, 4);
    const nextColumn = templateBubblePosition(30, 0, 4);

    expect(nextRow.y).toBeGreaterThan(first.y);
    expect(nextColumn.x).toBeGreaterThan(first.x);
    expect(nextColumn.y).toBeCloseTo(first.y);
  });

  it('ค้นหา marker สี่มุมและอ่านวงจากข้อมูลภาพครบ pipeline', () => {
    const image = createWhiteImage(970, 1405);
    const markers = [
      { x: 26, y: 26 },
      { x: 944, y: 31 },
      { x: 30, y: 1379 },
      { x: 948, y: 1383 },
    ] as const;
    markers.forEach((marker) => drawSquare(image, marker, 20));

    const exam = {
      ...createExam(),
      questions: [
        createQuestion(1),
        createQuestion(2),
        createQuestion(3),
        createQuestion(4),
        createQuestion(5),
      ],
    };
    const markedChoices = [1, 2, null, 3] as const;
    markedChoices.forEach((choice, questionIndex) => {
      if (choice === null) return;
      const position = templateBubblePosition(
        questionIndex,
        choice,
        exam.questions[questionIndex]?.choices.length ?? 4,
      );
      drawDisc(image, interpolateTestMarkers(markers, position), 9);
    });
    [0, 1].forEach((choice) => {
      const position = templateBubblePosition(4, choice, 4);
      drawDisc(image, interpolateTestMarkers(markers, position), 9);
    });

    const analysis = analyzeImageData(image, exam);

    expect(analysis.markerQuality).toBeGreaterThan(0.8);
    expect(analysis.answers.map(({ choice, status }) => ({ choice, status }))).toEqual([
      { choice: 1, status: 'confirmed' },
      { choice: 2, status: 'confirmed' },
      { choice: null, status: 'unanswered' },
      { choice: 3, status: 'confirmed' },
      { choice: null, status: 'ambiguous' },
    ]);
    expect(analysis.averageConfidence).toBeGreaterThan(0.85);
  });

  it('หยุดอ่านภาพเมื่อไม่พบ marker ครบแทนการเดาคำตอบ', () => {
    expect(() => analyzeImageData(createWhiteImage(970, 1405), createExam())).toThrow(
      'ไม่พบจุดสี่มุมครบ',
    );
  });
});
