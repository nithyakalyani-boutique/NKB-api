import {z} from 'zod';
export const recovery=z.object({reference:z.string().min(1).max(60),email:z.email()}).strict();
