import { z } from 'zod';
export const receipt = z
  .object({
    fxRate: z.string().regex(/^\d+(\.\d{1,12})?$/),
    chargesMinor: z.string().regex(/^\d{1,15}$/),
    noFurtherCharges: z.literal(true),
    lines: z
      .array(z.object({ purchaseLineId: z.uuid(), quantity: z.number().int().positive() }).strict())
      .min(1)
      .max(100),
  })
  .strict();
