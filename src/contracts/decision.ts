import {z} from 'zod';
export const decision=z.object({decision:z.enum(['APPROVED','REJECTED']),reason:z.string().min(5).max(500)}).strict();
