import type {Tx} from '../database/db.js';
import {dataJson} from '../database/db.js';
import {hash,canonical} from './crypto.js';
import {requireThat} from './problem.js';
export async function idempotent<T>(tx:Tx,scope:string,actor:string,key:string|undefined,body:unknown,fn:()=>Promise<T>):Promise<T>{requireThat(key&&key.length>=8&&key.length<=200,'IDEMPOTENCY_REQUIRED','Supply an Idempotency-Key header.',400);const requestHash=hash(JSON.stringify(body));const old=await tx.idempotencyRecord.findUnique({where:{scope_actor_key:{scope,actor,key}}});if(old){requireThat(old.requestHash===requestHash,'IDEMPOTENCY_KEY_REUSED','This key belongs to another request.',409);return old.response as T;}const response=await fn();await tx.idempotencyRecord.create({data:{scope,actor,key,requestHash,response:dataJson(response),expiresAt:new Date(Date.now()+86400000)}});return response;}
