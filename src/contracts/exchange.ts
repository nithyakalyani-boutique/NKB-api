import { z } from 'zod';
export const exchange = z
  .object({ challengeId: z.uuid(), code: z.string().regex(/^[a-f0-9]{64}$/) })
  .strict();
