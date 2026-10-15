import {spawn} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(!existsSync('api/.env'))writeFileSync('api/.env',readFileSync('api/.env.example','utf8').replace('replace-with-a-random-secret-at-least-32-characters',randomBytes(32).toString('hex')));
if(!existsSync('client/.env.local'))writeFileSync('client/.env.local',readFileSync('client/.env.example','utf8'));
const children=[];const pm='node_modules/pnpm/bin/pnpm.cjs';const preview=process.argv.includes('--preview');let stopping=false,pg;
function start(args,options={}){const child=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true,...options});children.push(child);child.on('error',error=>{console.error(error.message);void stop(1);});return child;}
function run(args){return new Promise((resolve,reject)=>{const child=start([pm,...args]);child.once('exit',code=>code===0?resolve():reject(Error('Command failed: '+args.join(' '))));});}
async function stop(code=0){if(stopping)return;stopping=true;
 for(const child of children)if(child!==pg&&child.exitCode===null){if(process.platform==='win32')spawn('taskkill',['/pid',String(child.pid),'/t','/f'],{stdio:'ignore',windowsHide:true});else child.kill('SIGTERM');}
 if(pg?.connected){pg.send('stop');await Promise.race([new Promise(resolve=>pg.once('exit',resolve)),new Promise(resolve=>setTimeout(resolve,5000))]);}
 if(pg?.exitCode===null)pg.kill('SIGTERM');process.exit(code);
}
process.on('SIGINT',()=>void stop());process.on('SIGTERM',()=>void stop());
try{
 for(const port of [3000,4000]){const ready=await fetch('http://localhost:'+port+(port===4000?'/health/live':'/')).then(()=>true).catch(()=>false);if(ready)throw Error('A service is already running on port '+port+'. Stop the earlier stack first.');}
 pg=start(['scripts/local-postgres.mjs'],{stdio:['ignore','pipe','inherit','ipc']});
 await new Promise((resolve,reject)=>{let output='';pg.stdout.on('data',chunk=>{process.stdout.write(chunk);output+=String(chunk);if(output.includes('PostgreSQL ready'))resolve();});pg.once('exit',()=>reject(Error('Local PostgreSQL failed to start.')));});
 await run(['db:generate']);await run(['db:migrate']);await run(['db:seed']);await run(['--filter','@nkb/api','build']);
 if(preview)await run(['--filter','@nkb/client','build']);
 const api=start(['dist/main.js'],{cwd:'api'});const worker=start(['dist/worker.js'],{cwd:'api',env:{...process.env,WORKER_TRANSPORT:'postgres'}});const client=start([pm,'--filter','@nkb/client',preview?'start':'dev']);
 for(const child of [api,worker,client,pg])child.once('exit',code=>{if(!stopping){console.error('A local service stopped; shutting down the owned stack.');void stop(code||1);}});
 console.log('Open http://localhost:3000/en — staff sign-in: /admin/sign-in');
}catch(error){console.error(error.message);await stop(1);}
