import type {Context} from '../common/context.js';
import {db,transaction,type Tx} from '../database/db.js';
import {found,requireThat} from '../common/problem.js';
import {money} from '../common/money.js';
export async function currentCart(tx:Tx,ctx:Context){return (await tx.cart.findFirst({where:{actor:ctx.actor,status:'ACTIVE'}}))||tx.cart.create({data:{actor:ctx.actor,userId:ctx.userId}});}
