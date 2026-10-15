import { z } from 'zod';
export const promotion = z
  .object({
    code: z.string().regex(/^[A-Z0-9_-]{2,40}$/),
    title: z.string().min(2).max(100),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    basisPoints: z.number().int().min(1).max(10000).optional(),
    amountMinor: z
      .string()
      .regex(/^\d{1,15}$/)
      .optional(),
    minimumMinor: z.string().regex(/^\d{1,15}$/),
    maximumMinor: z
      .string()
      .regex(/^\d{1,15}$/)
      .optional(),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    limit: z.number().int().positive(),
    perCustomerLimit: z.number().int().positive(),
    status: z.enum(['DRAFT', 'ACTIVE', 'DISABLED']),
  })
  .strict()
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), 'End must follow start')
  .refine(
    (v) => (v.type === 'PERCENTAGE' ? v.basisPoints !== undefined : v.amountMinor !== undefined),
    'Discount value required',
  );
