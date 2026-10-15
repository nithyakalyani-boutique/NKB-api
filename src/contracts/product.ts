import { z } from 'zod';
export const product = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(120),
    title: z.string().min(3).max(150),
    description: z.string().min(10).max(8000),
    fabric: z.string().min(2).max(50),
    weave: z.string().max(80),
    colour: z.string().min(2).max(50),
    occasion: z.string().min(2).max(50),
    care: z.string().min(5).max(1000),
    lengthMm: z.number().int().positive(),
    widthMm: z.number().int().positive(),
    blouseIncluded: z.boolean(),
    demo: z.boolean(),
    images: z
      .array(
        z
          .object({
            url: z
              .string()
              .regex(/^(\/images\/|\/api\/v1\/media\/|https:\/\/res\.cloudinary\.com\/)/),
            alt: z.string().min(1).max(200),
          })
          .strict(),
      )
      .max(12),
    sku: z.string().min(3).max(60),
    priceMinor: z.string().regex(/^\d{1,15}$/),
    weightG: z.number().int().positive(),
  })
  .strict();
