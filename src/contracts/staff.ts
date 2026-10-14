import {z} from 'zod';
export const staff=z.object({userId:z.string().min(1),role:z.enum(['OWNER','ADMIN','CATALOG_MANAGER','FULFILLMENT','SUPPORT','FINANCE','ANALYST']),active:z.boolean()}).strict();
