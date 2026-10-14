import {z} from 'zod';
export const checkout=z.object({quoteId:z.uuid(),acceptedTermsVersion:z.literal('draft-v1')}).strict();
