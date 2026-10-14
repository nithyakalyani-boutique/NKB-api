import {z} from 'zod';
export const address=z.object({recipient:z.string().trim().min(2).max(100),line1:z.string().trim().min(3).max(200),line2:z.string().max(200).optional(),city:z.string().trim().min(2).max(100),region:z.string().max(100).optional(),postalCode:z.string().max(20).optional(),country:z.string().regex(/^[A-Z]{2}$/),phone:z.string().regex(/^\+?[0-9 ()-]{7,25}$/)}).strict();
