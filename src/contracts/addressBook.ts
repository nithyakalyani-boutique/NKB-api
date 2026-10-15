import { z } from 'zod';
import { address } from './address.js';
export const addressBook = z
  .object({ label: z.string().min(1).max(60), address: address, isDefault: z.boolean() })
  .strict();
