import {db,transaction,dataJson,type Tx} from '../database/db.js';
import type {Context} from '../common/context.js';
import {found,requireThat} from '../common/problem.js';
import {audit,event} from '../common/audit.js';
import {idempotent} from '../common/idempotency.js';
import {move} from './checkout.js';
import {allocate,fx} from '../common/money.js';
export async function adjustStock(ctx:Context,input:Record<string,unknown>){return transaction(tx=>idempotent(tx,'stock',ctx.actor,ctx.req.header('Idempotency-Key'),input,async()=>{const warehouse=found(await tx.warehouse.findFirst({where:{active:true}}));const variantId=String(input.variantId);found(await tx.variant.findUnique({where:{id:variantId}}));await tx.inventoryBalance.upsert({where:{variantId_warehouseId:{variantId,warehouseId:warehouse.id}},create:{variantId,warehouseId:warehouse.id},update:{}});await move(tx,variantId,warehouse.id,Number(input.delta),0,'ADJUSTMENT',ctx.req.header('Idempotency-Key')!,ctx.actor,'adjust:'+ctx.req.header('Idempotency-Key'),String(input.reason));await audit(tx,ctx,'inventory.adjust',variantId,{delta:input.delta,reason:input.reason});return tx.inventoryBalance.findUnique({where:{variantId_warehouseId:{variantId,warehouseId:warehouse.id}}});}));}
