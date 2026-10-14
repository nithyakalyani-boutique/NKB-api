import {z} from 'zod';
export const supplier=z.object({name:z.string().min(2).max(150),country:z.string().length(2),currency:z.enum(['INR','LKR']),email:z.email().optional()}).strict();
