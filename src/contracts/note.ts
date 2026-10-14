import {z} from 'zod';
export const note=z.object({body:z.string().min(1).max(3000)}).strict();
