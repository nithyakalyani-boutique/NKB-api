import { z } from 'zod';
export const profile = z.object({ name: z.string().min(2).max(100) }).strict();
