import {z} from 'zod';
import {address} from './address.js';
export const quote=z.object({cartVersion:z.number().int().positive(),locale:z.literal('en'),email:z.email().max(254),shippingAddress:address,billingAddress:address.optional(),shippingMethodId:z.uuid().optional(),couponCode:z.string().max(40).optional()}).strict();
