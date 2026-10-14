import {z} from 'zod';
export const adjustment=z.object({variantId:z.uuid(),delta:z.number().int().min(-10000).max(10000).refine(v=>v!==0),reason:z.string().min(5).max(500)}).strict();
