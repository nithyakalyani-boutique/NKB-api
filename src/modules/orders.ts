import {db,transaction,dataJson,type Tx} from '../database/db.js';
import type {Context} from '../common/context.js';
import {found,requireThat} from '../common/problem.js';
import {hash,token} from '../common/crypto.js';
import {event,audit} from '../common/audit.js';
import {idempotent} from '../common/idempotency.js';
import {orderResult} from './checkout.js';
import {env} from '../config/env.js';
export async function ownedOrder(ctx:Context,id:string,tx:Tx=db){const order=found(await tx.order.findUnique({where:{id},include:{lines:true,attempts:true,shipments:{include:{items:true}},refunds:true,requests:true}}));const grant=ctx.req.cookies?.nkb_order?await tx.guestGrant.findFirst({where:{orderId:id,credentialHash:hash(String(ctx.req.cookies.nkb_order)),expiresAt:{gt:new Date()}}}):null;requireThat(order.userId&&order.userId===ctx.userId||order.actor===ctx.actor||grant,'NOT_FOUND','This order is not available.',404);return order;}
export async function orderView(ctx:Context,id:string){const order=await ownedOrder(ctx,id);return {...order,actor:undefined,lines:order.lines.map(l=>({...l,costSnapshot:undefined})),attempts:order.attempts.map(a=>({id:a.id,status:a.status})),refunds:order.refunds.map(r=>({id:r.id,amountMinor:r.amountMinor,status:r.status})),total:{amountMinor:String(order.totalMinor),currency:order.currency,exponent:2}};}
