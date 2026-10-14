import {Redis} from 'ioredis';
import {db} from '../database/db.js';
import {env} from './env.js';
const redis=env.APP_ENV==='production'?new Redis(env.REDIS_URL,{lazyConnect:true,enableOfflineQueue:false,maxRetriesPerRequest:1,connectTimeout:2000,retryStrategy:()=>null}):null;
redis?.on('error',()=>{});
export async function readiness(){
 await db.$queryRaw`SELECT 1 FROM "StoreSetting" LIMIT 1`;
 if(redis){if(redis.status==='wait'||redis.status==='end')await redis.connect();await redis.ping();}
 return {status:'ready',database:'ok',queue:redis?'ok':'local mode'};
}
export function closeReadiness(){redis?.disconnect();}
