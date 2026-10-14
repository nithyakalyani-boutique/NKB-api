import type {z} from 'zod';
import type {Context} from './context.js';
export type Route={method:'GET'|'POST'|'PATCH'|'DELETE';path:string;summary:string;schema?:z.ZodType;permission?:string;authenticated?:boolean;status?:number;webhook?:boolean;handler:(ctx:Context,input:Record<string,unknown>,params:Record<string,string>)=>Promise<unknown>};
