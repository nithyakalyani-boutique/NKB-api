import {spawn} from 'node:child_process';
const executable=process.platform==='win32'?'pnpm.cmd':'pnpm';
const children=['dev','worker'].map(script=>spawn(executable,['--filter','@nkb/api',script],{stdio:'inherit',shell:process.platform==='win32'}));
children.push(spawn(executable,['--filter','@nkb/client','dev'],{stdio:'inherit',shell:process.platform==='win32'}));
function stop(){for(const child of children)child.kill();}process.on('SIGINT',stop);process.on('SIGTERM',stop);for(const child of children)child.on('exit',code=>{if(code)stop();});
