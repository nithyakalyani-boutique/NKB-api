import {env} from '../config/env.js';
import {decimal} from '../common/money.js';

export type RefundResult={status:'SUCCEEDED';reference:string}|{status:'FAILED'|'UNKNOWN'};
// No automatic retry: a timeout after submission may still have moved money.
export async function payHereRefund(paymentId:string,amount:bigint,reason:string,send:typeof fetch=fetch):Promise<RefundResult>{
 const appId=process.env.PAYHERE_APP_ID,secret=process.env.PAYHERE_APP_SECRET;
 if(!appId||!secret)throw Error('PayHere Merchant API credentials are required');
 const base=env.PAYHERE_MODE==='live'?'https://www.payhere.lk':'https://sandbox.payhere.lk';
 const tokenResponse=await send(base+'/merchant/v1/oauth/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(appId+':'+secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000)});
 if(!tokenResponse.ok)throw Error('PayHere authentication unavailable');
 const token=await tokenResponse.json() as {access_token?:string};
 if(!token.access_token)throw Error('PayHere authentication unavailable');
 try{
  const response=await send(base+'/merchant/v1/payment/refund',{method:'POST',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},body:JSON.stringify({payment_id:paymentId,amount:decimal(amount),description:reason}),signal:AbortSignal.timeout(20000)});
  if(!response.ok)return {status:'UNKNOWN'};
  const result=await response.json() as {status?:number;data?:unknown};
  if(result.status===1&&(typeof result.data==='string'||typeof result.data==='number')&&String(result.data).match(/^\d+$/))return {status:'SUCCEEDED',reference:'payhere:refund:'+String(result.data)};
  if(result.status===0||result.status===-1||result.status===-2)return {status:'FAILED'};
  return {status:'UNKNOWN'};
 }catch{return {status:'UNKNOWN'};}
}
