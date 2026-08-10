/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { maxQuestionsPerAnswerSheet } from '../../lib/answerSheetLayout';
import type { Exam, MarkedAnswer } from '../../types/domain';

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Marker extends Point {
  readonly quality: number;
}

interface MarkerSet {
  readonly topLeft: Marker;
  readonly topRight: Marker;
  readonly bottomLeft: Marker;
  readonly bottomRight: Marker;
}

export interface OmrAnalysis {
  readonly answers: readonly MarkedAnswer[];
  readonly averageConfidence: number;
  readonly markerQuality: number;
}

export interface FillClassification {
  readonly choice: number | null;
  readonly status: MarkedAnswer['status'];
  readonly confidence: number;
}

export interface OmrPixelData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
}

const sheetWidthMm = 194;
const sheetHeightMm = 281;
const markerInsetMm = 5.175;
const markerRightMm = sheetWidthMm - markerInsetMm;
const markerBottomMm = sheetHeightMm - markerInsetMm;
const questionsPerColumn = 30;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function classifyFillScores(scores: readonly number[]): FillClassification {
  const ranked = scores
    .map((score, choice) => ({ score, choice }))
    .sort((left, right) => right.score - left.score);
  const strongest = ranked[0];
  const second = ranked[1];
  if (!strongest || strongest.score < 0.16) {
    return { choice: null, status: 'unanswered', confidence: 0.9 };
  }

  const gap = strongest.score - (second?.score ?? 0);
  const competingMarks = ranked.filter(
    (item) => item.score >= 0.18 && strongest.score - item.score < 0.09,
  ).length;
  if (strongest.score < 0.26 || gap < 0.09 || competingMarks > 1) {
    return {
      choice: null,
      status: 'ambiguous',
      confidence: clamp(0.5 - gap, 0.2, 0.49),
    };
  }

  return {
    choice: strongest.choice,
    status: 'confirmed',
    confidence: clamp(0.58 + gap * 1.4 + (strongest.score - 0.26) * 0.35, 0.58, 0.99),
  };
}

export function templateBubblePosition(
  questionIndex: number,
  choiceIndex: number,
  choiceCount: number,
): Point {
  const column = Math.floor(questionIndex / questionsPerColumn);
  const row = questionIndex % questionsPerColumn;
  const columnStartMm = column === 0 ? 10 : 100.5;
  const optionsStartMm = columnStartMm + 9.5;
  const optionsWidthMm = 74;
  const bubbleOffsetMm = 1.75;
  const xMm =
    optionsStartMm + ((choiceIndex + 0.5) * optionsWidthMm) / choiceCount + bubbleOffsetMm;
  const yMm = 53.5 + row * 7;

  return {
    x: (xMm - markerInsetMm) / (markerRightMm - markerInsetMm),
    y: (yMm - markerInsetMm) / (markerBottomMm - markerInsetMm),
  };
}

function createDarknessMap(imageData: OmrPixelData): Uint8Array {
  const pixels = imageData.data;
  const darkness = new Uint8Array(imageData.width * imageData.height);
  for (let sourceIndex = 0, targetIndex = 0; sourceIndex < pixels.length; sourceIndex += 4) {
    const red = pixels[sourceIndex] ?? 255;
    const green = pixels[sourceIndex + 1] ?? 255;
    const blue = pixels[sourceIndex + 2] ?? 255;
    const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
    darkness[targetIndex] = Math.round(255 - luminance);
    targetIndex += 1;
  }
  return darkness;
}

function createIntegralMap(darkness: Uint8Array, width: number, height: number): Uint32Array {
  const stride = width + 1;
  const integral = new Uint32Array(stride * (height + 1));
  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < width; x += 1) {
      rowSum += darkness[y * width + x] ?? 0;
      integral[(y + 1) * stride + x + 1] = (integral[y * stride + x + 1] ?? 0) + rowSum;
    }
  }
  return integral;
}

function rectangleSum(
  integral: Uint32Array,
  stride: number,
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  const right = x + width;
  const bottom = y + height;
  return (
    (integral[bottom * stride + right] ?? 0) -
    (integral[y * stride + right] ?? 0) -
    (integral[bottom * stride + x] ?? 0) +
    (integral[y * stride + x] ?? 0)
  );
}

function findMarker(
  integral: Uint32Array,
  imageWidth: number,
  imageHeight: number,
  horizontal: 'left' | 'right',
  vertical: 'top' | 'bottom',
): Marker {
  const side = Math.max(8, Math.round(Math.min(imageWidth, imageHeight) * 0.018));
  const step = Math.max(2, Math.round(side / 3));
  const xStart = horizontal === 'left' ? 0 : Math.round(imageWidth * 0.7);
  const xEnd = horizontal === 'left' ? Math.round(imageWidth * 0.3) : imageWidth;
  const yStart = vertical === 'top' ? 0 : Math.round(imageHeight * 0.7);
  const yEnd = vertical === 'top' ? Math.round(imageHeight * 0.3) : imageHeight;
  const stride = imageWidth + 1;
  let bestX = xStart;
  let bestY = yStart;
  let bestQuality = 0;

  for (let y = yStart; y + side < yEnd; y += step) {
    for (let x = xStart; x + side < xEnd; x += step) {
      const quality = rectangleSum(integral, stride, x, y, side, side) / (side * side * 255);
      if (quality > bestQuality) {
        bestQuality = quality;
        bestX = x;
        bestY = y;
      }
    }
  }

  return { x: bestX + side / 2, y: bestY + side / 2, quality: bestQuality };
}

function detectMarkers(darkness: Uint8Array, width: number, height: number): MarkerSet {
  const integral = createIntegralMap(darkness, width, height);
  const markers: MarkerSet = {
    topLeft: findMarker(integral, width, height, 'left', 'top'),
    topRight: findMarker(integral, width, height, 'right', 'top'),
    bottomLeft: findMarker(integral, width, height, 'left', 'bottom'),
    bottomRight: findMarker(integral, width, height, 'right', 'bottom'),
  };
  const quality = Math.min(
    markers.topLeft.quality,
    markers.topRight.quality,
    markers.bottomLeft.quality,
    markers.bottomRight.quality,
  );
  const topWidth = Math.hypot(
    markers.topRight.x - markers.topLeft.x,
    markers.topRight.y - markers.topLeft.y,
  );
  const leftHeight = Math.hypot(
    markers.bottomLeft.x - markers.topLeft.x,
    markers.bottomLeft.y - markers.topLeft.y,
  );
  if (quality < 0.28 || topWidth < width * 0.55 || leftHeight < height * 0.55) {
    throw new Error('ไม่พบจุดสี่มุมครบ กรุณาถ่ายให้เห็นกระดาษเต็มแผ่นและไม่ให้เงาบัง');
  }
  return markers;
}

function interpolate(markers: MarkerSet, position: Point): Point {
  const topX = markers.topLeft.x + (markers.topRight.x - markers.topLeft.x) * position.x;
  const topY = markers.topLeft.y + (markers.topRight.y - markers.topLeft.y) * position.x;
  const bottomX =
    markers.bottomLeft.x + (markers.bottomRight.x - markers.bottomLeft.x) * position.x;
  const bottomY =
    markers.bottomLeft.y + (markers.bottomRight.y - markers.bottomLeft.y) * position.x;
  return {
    x: topX + (bottomX - topX) * position.y,
    y: topY + (bottomY - topY) * position.y,
  };
}

function sampleDisc(
  darkness: Uint8Array,
  width: number,
  height: number,
  center: Point,
  radius: number,
): number {
  const radiusSquared = radius * radius;
  const startX = Math.max(0, Math.floor(center.x - radius));
  const endX = Math.min(width - 1, Math.ceil(center.x + radius));
  const startY = Math.max(0, Math.floor(center.y - radius));
  const endY = Math.min(height - 1, Math.ceil(center.y + radius));
  let total = 0;
  let count = 0;
  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const deltaX = x - center.x;
      const deltaY = y - center.y;
      if (deltaX * deltaX + deltaY * deltaY > radiusSquared) continue;
      total += darkness[y * width + x] ?? 0;
      count += 1;
    }
  }
  return count === 0 ? 0 : total / (count * 255);
}

export function analyzeImageData(imageData: OmrPixelData, exam: Exam): OmrAnalysis {
  if (exam.questions.length > maxQuestionsPerAnswerSheet) {
    throw new Error(`OMR รองรับสูงสุด ${maxQuestionsPerAnswerSheet} ข้อต่อกระดาษหนึ่งแผ่น`);
  }

  const { width, height } = imageData;
  const darkness = createDarknessMap(imageData);
  const markers = detectMarkers(darkness, width, height);
  const horizontalSpan = Math.hypot(
    markers.topRight.x - markers.topLeft.x,
    markers.topRight.y - markers.topLeft.y,
  );
  const verticalSpan = Math.hypot(
    markers.bottomLeft.x - markers.topLeft.x,
    markers.bottomLeft.y - markers.topLeft.y,
  );
  const radius = Math.max(
    2,
    Math.min((horizontalSpan * 1.15) / 183.65, (verticalSpan * 1.15) / 270.65),
  );

  const answers = exam.questions.map((question, questionIndex): MarkedAnswer => {
    const scores = question.choices.map((_, choiceIndex) => {
      const position = templateBubblePosition(questionIndex, choiceIndex, question.choices.length);
      return sampleDisc(darkness, width, height, interpolate(markers, position), radius);
    });
    const classification = classifyFillScores(scores);
    return {
      questionId: question.id,
      choice: classification.choice,
      status: classification.status,
      confidence: classification.confidence,
    };
  });
  const confidenceValues = answers.map((answer) => answer.confidence ?? 0);
  const markerQuality =
    (markers.topLeft.quality +
      markers.topRight.quality +
      markers.bottomLeft.quality +
      markers.bottomRight.quality) /
    4;
  return {
    answers,
    averageConfidence:
      confidenceValues.length === 0
        ? 0
        : confidenceValues.reduce((total, value) => total + value, 0) / confidenceValues.length,
    markerQuality,
  };
}

async function loadImage(file: File): Promise<{
  readonly source: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  readonly dispose: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch {
      // Some browsers cannot decode SVG/HEIC through createImageBitmap; Image is the safe fallback.
    }
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  await image.decode();
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    dispose: () => URL.revokeObjectURL(url),
  };
}

export async function analyzeAnswerSheet(file: File, exam: Exam): Promise<OmrAnalysis> {
  if (exam.questions.length > maxQuestionsPerAnswerSheet) {
    throw new Error(`OMR รองรับสูงสุด ${maxQuestionsPerAnswerSheet} ข้อต่อกระดาษหนึ่งแผ่น`);
  }
  const image = await loadImage(file);
  try {
    const scale = Math.min(1, 1600 / image.width);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('อุปกรณ์นี้ไม่รองรับการวิเคราะห์ภาพ');
    context.drawImage(image.source, 0, 0, width, height);
    return analyzeImageData(context.getImageData(0, 0, width, height), exam);
  } finally {
    image.dispose();
  }
}
