import { z } from 'zod';
export const checkout = z
  .object({ quoteId: z.uuid(), acceptedTermsVersion: z.string().min(1).max(100) })
  .strict();
