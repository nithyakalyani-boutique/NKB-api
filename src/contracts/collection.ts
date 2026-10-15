import { z } from 'zod';
export const collection = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(2),
    description: z.string().min(5),
    image: z.string().regex(/^\/images\//),
    status: z.enum(['DRAFT', 'PUBLISHED']),
    productIds: z.array(z.uuid()).max(100),
  })
  .strict();
