import { z } from 'zod';
export const request = z
  .object({
    reason: z.string().min(5).max(500),
    items: z
      .array(z.object({ orderLineId: z.uuid(), quantity: z.number().int().positive() }).strict())
      .min(1),
  })
  .strict();
