import {z} from 'zod';
export const purchase=z.object({supplierId:z.uuid(),currency:z.enum(['INR','LKR']),lines:z.array(z.object({variantId:z.uuid(),quantity:z.number().int().min(1).max(10000),unitCostMinor:z.string().regex(/^\d{1,15}$/)}).strict()).min(1).max(100)}).strict();
