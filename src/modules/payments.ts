import {db,transaction,dataJson,type Tx} from '../database/db.js';
import {found,requireThat} from '../common/problem.js';
import {move} from './checkout.js';
import {event} from '../common/audit.js';
import {hash} from '../common/crypto.js';
export type PaymentNotice={reference:string;amount:bigint;currency:string;status:string;providerReference:string};
export async function issue(tx:Tx,orderId:string,attemptId:string,code:string,amount:bigint){await tx.reconciliationIssue.create({data:{orderId,attemptId,code,requiredRefundMinor:amount,evidence:{source:'verified-payment'},dueAt:new Date(Date.now()+86400000)}});await tx.order.update({where:{id:orderId},data:{financialFlag:'REVIEW_REQUIRED',fulfillmentException:code}});await event(tx,'PAYMENT_REVIEW',orderId,{orderId},code+':'+attemptId);}
