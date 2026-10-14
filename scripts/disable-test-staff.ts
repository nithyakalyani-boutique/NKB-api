import {db,transaction} from '../src/database/db.js';
import {env} from '../src/config/env.js';
if(!['local','test'].includes(env.APP_ENV))throw Error('Local test cleanup is unavailable outside local/test');
const grants=await db.staffGrant.findMany({where:{grantedBy:'explicit-local-e2e-command',active:true}});
for(const grant of grants)await transaction(async tx=>{await tx.staffGrant.update({where:{id:grant.id},data:{active:false}});await tx.session.deleteMany({where:{userId:grant.userId}});await tx.auditEvent.create({data:{actor:'test-cleanup',action:'test.staff.disable',resourceId:grant.userId,detail:{},requestId:crypto.randomUUID()}});});
console.log('Disabled '+grants.length+' ephemeral staff grants and revoked their sessions.');await db.$disconnect();
