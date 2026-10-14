import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {env} from '../config/env.js';
export const token=()=>randomBytes(32).toString('hex');
export const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
export const csrf=(actor:string)=>createHmac('sha256',env.BETTER_AUTH_SECRET).update('csrf:'+actor).digest('hex');
export function safeEqual(a:string,b:string){const x=Buffer.from(a);const y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
