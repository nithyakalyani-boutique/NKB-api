import 'dotenv/config';
import {z} from 'zod';
const schema=z.object({APP_ENV:z.enum(['local','test','staging','production']).default('local'),PORT:z.coerce.number().default(4000),PUBLIC_APP_URL:z.url().default('http://localhost:3000'),DATABASE_URL:z.string().min(1),REDIS_URL:z.string().default('redis://localhost:6379'),BETTER_AUTH_SECRET:z.string().min(32),BETTER_AUTH_URL:z.url().default('http://localhost:3000'),TRUSTED_ORIGINS:z.string().default('http://localhost:3000'),PAYMENT_PROVIDER:z.enum(['fake','payhere']).default('fake'),PAYHERE_MODE:z.enum(['sandbox','live']).default('sandbox'),PAYHERE_MERCHANT_ID:z.string().optional(),PAYHERE_MERCHANT_SECRET:z.string().optional(),SHIPPING_PROVIDER:z.enum(['manual','dhl']).default('manual'),MEDIA_PROVIDER:z.enum(['local','cloudinary']).default('local'),EMAIL_PROVIDER:z.enum(['local','resend']).default('local'),RESEND_API_KEY:z.string().optional(),EMAIL_FROM:z.string().default('Nithyakalyani Boutique <store@example.invalid>')});
export const env=schema.parse(process.env);
if(env.APP_ENV==='production'&&(env.PAYMENT_PROVIDER!=='payhere'||env.PAYHERE_MODE!=='live'||env.MEDIA_PROVIDER==='local'||env.EMAIL_PROVIDER==='local'))throw Error('Production requires live configured providers');
if(env.PAYMENT_PROVIDER==='payhere'&&(!env.PAYHERE_MERCHANT_ID||!env.PAYHERE_MERCHANT_SECRET))throw Error('PayHere credentials are required');
if(env.EMAIL_PROVIDER==='resend'&&!env.RESEND_API_KEY)throw Error('Resend credentials are required');
if(env.APP_ENV==='production'&&(!env.PUBLIC_APP_URL.startsWith('https:')||env.BETTER_AUTH_SECRET.includes('replace-')))throw Error('Production requires HTTPS and a private authentication secret');
export const origins=env.TRUSTED_ORIGINS.split(',');
