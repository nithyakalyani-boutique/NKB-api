import {db} from '../database/db.js';
import type {Prisma} from '../generated/prisma/client.js';
import {found,requireThat} from '../common/problem.js';
import {money} from '../common/money.js';
export const productInclude={variants:{where:{active:true},include:{balances:true}},collections:{include:{collection:true}}} satisfies Prisma.ProductInclude;
export function publicProduct(p:Prisma.ProductGetPayload<{include:typeof productInclude}>){return {...p,variants:p.variants.map(v=>({id:v.id,sku:v.sku,title:v.title,weightG:v.weightG,price:money(v.priceMinor),available:v.balances.reduce((s,b)=>s+b.onHand-b.reserved,0)})),collections:p.collections.map(c=>({slug:c.collection.slug,title:c.collection.title}))};}
