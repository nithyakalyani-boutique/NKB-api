import {z} from 'zod';
export const content=z.object({slug:z.string().regex(/^[a-z0-9-]+$/),title:z.string().min(2).max(200),kind:z.enum(['PAGE','POLICY','JOURNAL']),body:z.string().min(10).max(30000),status:z.enum(['DRAFT','PUBLISHED']),version:z.number().int().positive().optional()}).strict();
