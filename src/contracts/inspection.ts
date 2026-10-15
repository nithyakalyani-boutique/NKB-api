import { z } from 'zod';
export const inspection = z
  .object({
    items: z
      .array(
        z
          .object({
            orderLineId: z.uuid(),
            received: z.number().int().min(0),
            restock: z.number().int().min(0),
            condition: z.string().min(3).max(300),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
