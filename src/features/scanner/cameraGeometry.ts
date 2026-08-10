/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

export const a4PortraitAspectRatio = 210 / 297;

export interface CameraCrop {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
}

export function calculateA4Crop(sourceWidth: number, sourceHeight: number): CameraCrop {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('ขนาดภาพจากกล้องไม่ถูกต้อง');
  }

  const sourceAspectRatio = sourceWidth / sourceHeight;
  if (sourceAspectRatio > a4PortraitAspectRatio) {
    const cropWidth = sourceHeight * a4PortraitAspectRatio;
    return {
      sourceX: (sourceWidth - cropWidth) / 2,
      sourceY: 0,
      sourceWidth: cropWidth,
      sourceHeight,
    };
  }

  const cropHeight = sourceWidth / a4PortraitAspectRatio;
  return {
    sourceX: 0,
    sourceY: (sourceHeight - cropHeight) / 2,
    sourceWidth,
    sourceHeight: cropHeight,
  };
}
