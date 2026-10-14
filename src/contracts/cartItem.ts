import {z} from 'zod';
export const cartItem=z.object({variantId:z.uuid(),quantity:z.number().int().min(1).max(20),expectedVersion:z.number().int().positive()}).strict();
