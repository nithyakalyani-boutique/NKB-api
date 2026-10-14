import {betterAuth} from 'better-auth';
import {prismaAdapter} from 'better-auth/adapters/prisma';
import {twoFactor} from 'better-auth/plugins';
import {db} from '../database/db.js';
import {env,origins} from '../config/env.js';
export const auth=betterAuth({database:prismaAdapter(db,{provider:'postgresql'}),secret:env.BETTER_AUTH_SECRET,baseURL:env.BETTER_AUTH_URL,basePath:'/api/auth',trustedOrigins:origins,emailAndPassword:{enabled:true,minPasswordLength:12,requireEmailVerification:env.APP_ENV==='production',sendResetPassword:async({user,url})=>{await db.outboxEvent.create({data:{kind:'AUTH_EMAIL',aggregateId:user.id,payload:{email:user.email,subject:'Reset your password',body:url},dedupeKey:'reset:'+crypto.randomUUID()}});}},emailVerification:{sendVerificationEmail:async({user,url})=>{await db.outboxEvent.create({data:{kind:'AUTH_EMAIL',aggregateId:user.id,payload:{email:user.email,subject:'Verify your email',body:url},dedupeKey:'verify:'+crypto.randomUUID()}});}},plugins:[twoFactor({issuer:'Nithyakalyani Boutique'})],advanced:{useSecureCookies:env.PUBLIC_APP_URL.startsWith('https:')},rateLimit:{enabled:true,window:60,max:30,storage:'database'}});
