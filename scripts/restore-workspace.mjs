import {readdirSync,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const source=resolve(dirname(fileURLToPath(import.meta.url)),'../workspace');
const target=resolve(source,'../..');
function restore(directory){for(const entry of readdirSync(directory,{withFileTypes:true})){const src=resolve(directory,entry.name);if(entry.isDirectory()){restore(src);continue;}const rel=relative(source,src),dest=resolve(target,rel);if(relative(target,dest).startsWith('..'))throw Error('Workspace path escaped');const bytes=readFileSync(src);if(existsSync(dest)){if(!readFileSync(dest).equals(bytes))throw Error('Refusing to overwrite a different workspace file: '+rel);continue;}mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,bytes);}}
restore(source);console.log('Restored shared workspace inputs without overwriting local changes.');
