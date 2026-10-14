import {createHash} from 'node:crypto';
import {env} from '../config/env.js';
import {decimal,minor} from '../common/money.js';
import {safeEqual} from '../common/crypto.js';
import {requireThat} from '../common/problem.js';
export const md5=(v:string)=>createHash('md5').update(v).digest('hex').toUpperCase();
