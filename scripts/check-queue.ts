import {spawn} from 'node:child_process';
import {setTimeout} from 'node:timers/promises';
import {db} from '../src/database/db.js';
import {env} from '../src/config/env.js';
if(env.APP_ENV!=='test'||!new URL(env.DATABASE_URL).pathname.endsWith('_test'))throw Error('Queue acceptance requires an isolated test database');
const child=spawn(process.execPath,['dist/worker.js'],{stdio:'inherit',env:{...process.env,WORKER_TRANSPORT:'redis'}});
try{
 const work=await db.outboxEvent.create({data:{kind:'AUTH_EMAIL',aggregateId:crypto.randomUUID(),dedupeKey:'queue-test:'+crypto.randomUUID(),payload:{email:'queue-test@example.invalid',subject:'Synthetic queue test',body:'CI delivery smoke test'}}});
 let delivered=false;
 for(let attempt=0;attempt<60;attempt++){await setTimeout(500);const row=await db.outboxEvent.findUnique({where:{id:work.id}});if(row?.processedAt){delivered=true;break;}if(child.exitCode!==null)throw Error('Worker exited before delivery');}
 if(!delivered)throw Error('BullMQ worker did not process the durable event');
 const notification=await db.notification.findUnique({where:{eventId:work.id}});
 if(notification?.status!=='SENT')throw Error('Notification delivery not recorded');
 console.log('Redis/BullMQ durable outbox acceptance passed.');
}finally{child.kill('SIGTERM');await db.$disconnect();}
