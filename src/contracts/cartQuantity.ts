import { z } from 'zod';
export const cartQuantity = z
  .object({
    quantity: z.number().int().min(1).max(20),
    expectedVersion: z.number().int().positive(),
  })
  .strict();
