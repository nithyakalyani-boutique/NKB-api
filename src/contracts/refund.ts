import {z} from 'zod';
export const refund=z.object({amountMinor:z.string().regex(/^[1-9]\d{0,14}$/),reason:z.string().min(5).max(500),allocations:z.array(z.object({orderLineId:z.uuid().optional(),amountMinor:z.string().regex(/^\d{1,15}$/),kind:z.enum(['MERCHANDISE','SHIPPING','ADJUSTMENT'])}).strict()).min(1)}).strict();
