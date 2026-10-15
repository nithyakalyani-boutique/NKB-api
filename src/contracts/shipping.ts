import { z } from 'zod';
export const shipping = z
  .object({
    name: z.string().min(2).max(100),
    countries: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1),
    priceMinor: z.string().regex(/^\d{1,15}$/),
    enabled: z.boolean(),
    description: z.string().min(3).max(500),
    dutiesText: z.string().min(3).max(500),
  })
  .strict();
