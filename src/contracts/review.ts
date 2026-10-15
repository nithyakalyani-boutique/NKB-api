import { z } from 'zod';
export const review = z
  .object({
    orderLineId: z.uuid(),
    rating: z.number().int().min(1).max(5),
    body: z.string().min(10).max(2000),
  })
  .strict();
