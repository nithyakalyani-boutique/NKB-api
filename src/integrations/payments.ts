import {createHash} from 'node:crypto';
import {env} from '../config/env.js';
import {decimal,minor} from '../common/money.js';
import {safeEqual} from '../common/crypto.js';
import {requireThat} from '../common/problem.js';
export const md5=(v:string)=>createHash('md5').update(v).digest('hex').toUpperCase();
export function initiationHash(merchant:string,reference:string,amount:string,currency:string,secret:string){return md5(merchant+reference+amount+currency+md5(secret));}
export function notificationHash(merchant:string,reference:string,amount:string,currency:string,status:string,secret:string){return md5(merchant+reference+amount+currency+status+md5(secret));}
