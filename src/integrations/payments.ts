import {createHash} from 'node:crypto';
import {env} from '../config/env.js';
import {decimal,minor} from '../common/money.js';
import {safeEqual} from '../common/crypto.js';
import {requireThat} from '../common/problem.js';
export const md5=(v:string)=>createHash('md5').update(v).digest('hex').toUpperCase();
export function initiationHash(merchant:string,reference:string,amount:string,currency:string,secret:string){return md5(merchant+reference+amount+currency+md5(secret));}
export function notificationHash(merchant:string,reference:string,amount:string,currency:string,status:string,secret:string){return md5(merchant+reference+amount+currency+status+md5(secret));}
export function paymentForm(reference:string,amount:bigint,email:string,address:Record<string,string>,orderId:string){if(env.PAYMENT_PROVIDER==='fake')return {method:'POST',action:env.PUBLIC_APP_URL+'/en/checkout/demo',fields:{reference,orderId}};const merchant=env.PAYHERE_MERCHANT_ID!;const formatted=decimal(amount);return {method:'POST',action:env.PAYHERE_MODE==='live'?'https://www.payhere.lk/pay/checkout':'https://sandbox.payhere.lk/pay/checkout',fields:{merchant_id:merchant,order_id:reference,amount:formatted,currency:'LKR',items:'Nithyakalyani Boutique order',return_url:env.PUBLIC_APP_URL+'/en/checkout/return?order='+orderId,cancel_url:env.PUBLIC_APP_URL+'/en/checkout/cancel?order='+orderId,notify_url:env.PUBLIC_APP_URL+'/api/v1/webhooks/payhere',first_name:address.recipient,last_name:'',email,phone:address.phone,address:address.line1,city:address.city,country:address.country,hash:initiationHash(merchant,reference,formatted,'LKR',env.PAYHERE_MERCHANT_SECRET!)}};}
