import { z } from 'zod';
export const fulfillment = z
  .object({
    carrier: z.string().min(2).max(100),
    trackingNumber: z.string().min(2).max(100),
    costMinor: z
      .string()
      .regex(/^\d{1,15}$/)
      .optional(),
    items: z
      .array(z.object({ orderLineId: z.uuid(), quantity: z.number().int().positive() }).strict())
      .min(1)
      .max(100),
  })
  .strict();
