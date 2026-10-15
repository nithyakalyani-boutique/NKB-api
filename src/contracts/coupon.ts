import { z } from 'zod';
export const coupon = z
  .object({ code: z.string().trim().min(1).max(40), expectedVersion: z.number().int().positive() })
  .strict();
