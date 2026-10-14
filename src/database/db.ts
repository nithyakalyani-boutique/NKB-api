import {PrismaClient,Prisma} from '../generated/prisma/client.js';
import {PrismaPg} from '@prisma/adapter-pg';
import {env} from '../config/env.js';
export const db=new PrismaClient({adapter:new PrismaPg({connectionString:env.DATABASE_URL})});
export type Tx=Prisma.TransactionClient;
export const dataJson=(value:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(value,(_k,v:unknown)=>typeof v==='bigint'?v.toString():v)) as Prisma.InputJsonValue;
// A database-wide commerce write lock is intentionally conservative for a single boutique.
// All stock/payment/admin writers use it; replace with ordered aggregate locks only after load measurements.
export async function transaction<T>(fn:(tx:Tx)=>Promise<T>):Promise<T>{return db.$transaction(async tx=>{await tx.$executeRaw`SELECT pg_advisory_xact_lock(781204)`;return fn(tx);},{timeout:20000,maxWait:15000});}
