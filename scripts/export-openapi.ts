import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import {responseSchemas,responseName} from '../src/contracts/responses.js';
import { routes } from '../src/routes.js';
import { db } from '../src/database/db.js';
const paths: Record<string, Record<string, unknown>> = {};
for (const r of routes) {
  const path = '/api/v1/' + r.path.replace(/:([A-Za-z]+)/g, '{$1}');
  const name=responseName(r.method,r.path);
  const parameters:Record<string,unknown>[] = [...r.path.matchAll(/:([A-Za-z]+)/g)].map((m) => ({
    name: m[1],
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
  if(r.method!=='GET'&&!r.webhook)parameters.push({name:'Origin',in:'header',required:true,schema:{type:'string',format:'uri'}},{name:'X-CSRF-Token',in:'header',required:true,schema:{type:'string'}});
  if(r.method==='POST'&&['checkout/orders','orders/:id/payment-attempts','orders/:id/cancellation-requests','orders/:id/return-requests','admin/orders/:id/refunds','admin/orders/:id/fulfillments','admin/purchase-orders/:id/receipts','admin/returns/:id/receipts','admin/inventory/adjustments'].includes(r.path))parameters.push({name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',minLength:8,maxLength:200}});
  if(r.method==='DELETE'&&r.path.startsWith('cart/'))parameters.push({name:'If-Match',in:'header',required:true,schema:{type:'integer',minimum:1}});
  (paths[path] ||= {})[r.method.toLowerCase()] = {
    operationId: r.method.toLowerCase() + r.path.replace(/[^a-z0-9]/gi, '_'),
    summary: r.summary,
    parameters,
    ...(r.schema
      ? {
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: z.toJSONSchema(r.schema, { unrepresentable: 'any' }) },
            },
          },
        }
      : {}),
    responses: {
      [r.status || 200]: {
        description: 'Success',
        content: { 'application/json': { schema: name?{$ref:'#/components/schemas/'+name}:{type:'object',additionalProperties:true} } },
      },
      400: { description: 'Invalid request' },
      401: { description: 'Sign in required' },
      403: { description: 'Permission denied' },
      ...Object.fromEntries([400,401,403,404,409,422,429,500].map(status=>[status,{description:'Problem response',content:{'application/problem+json':{schema:{$ref:'#/components/schemas/Problem'}}}}])),
    },
    security: r.permission || r.authenticated ? [{ sessionCookie: [] }] : [],
  };
}
writeFileSync(
  'openapi.json',
  JSON.stringify(
    {
      openapi: '3.1.0',
      info: { title: 'Nithyakalyani Boutique API', version: '1.0.0' },
      paths,
      components: {
        schemas:Object.fromEntries(Object.entries(responseSchemas).map(([name,schema])=>[name,z.toJSONSchema(schema,{io:'input'})])),
        securitySchemes: {
          sessionCookie: { type: 'apiKey', in: 'cookie', name: 'better-auth.session_token' },
        },
      },
    },
    null,
    2,
  ) + '\n',
);
await db.$disconnect();
