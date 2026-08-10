/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { z } from 'zod';

const appConfigSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+$/),
});

export const appConfig = appConfigSchema.parse({
  name: import.meta.env.VITE_APP_NAME ?? 'SmartExam',
  version: '1.0',
});
