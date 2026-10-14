import {writeFileSync} from 'node:fs';
import {z} from 'zod';
import {routes} from '../src/routes.js';
import {db} from '../src/database/db.js';
const paths:Record<string,Record<string,unknown>>={};
for(const r of routes){const path='/api/v1/'+r.path.replace(/:([A-Za-z]+)/g,'{$1}');const parameters=[...r.path.matchAll(/:([A-Za-z]+)/g)].map(m=>({name:m[1],in:'path',required:true,schema:{type:'string'}}));(paths[path]||={})[r.method.toLowerCase()]={operationId:r.method.toLowerCase()+r.path.replace(/[^a-z0-9]/gi,'_'),summary:r.summary,parameters,...(r.schema?{requestBody:{required:true,content:{'application/json':{schema:z.toJSONSchema(r.schema,{unrepresentable:'any'})}}}}:{}),responses:{[r.status||200]:{description:'Success',content:{'application/json':{schema:{type:'object',additionalProperties:true}}}},400:{description:'Invalid request'},401:{description:'Sign in required'},403:{description:'Permission denied'},409:{description:'Concurrent state conflict'}},security:r.permission||r.authenticated?[{sessionCookie:[]}]:[]};}
writeFileSync('openapi.json',JSON.stringify({openapi:'3.1.0',info:{title:'Nithyakalyani Boutique API',version:'1.0.0'},paths,components:{securitySchemes:{sessionCookie:{type:'apiKey',in:'cookie',name:'better-auth.session_token'}}}},null,2)+'\n');await db.$disconnect();
