import { createInterface } from 'node:readline/promises';
import { db, transaction } from '../src/database/db.js';
import { roles } from '../src/auth/permissions.js';
const input = createInterface({ input: process.stdin, output: process.stdout });
const email = (
  await input.question('Email of an existing, verified account to make the first owner: ')
).trim();
input.close();
const user = await db.user.findUnique({ where: { email } });
if (!user || !user.emailVerified) throw Error('Sign up and verify this account first.');
await transaction(async (tx) => {
  if (await tx.staffGrant.count({ where: { role: 'OWNER', active: true } }))
    throw Error('An owner already exists. Use the staff access workflow.');
  await tx.staffGrant.create({
    data: {
      userId: user.id,
      role: 'OWNER',
      capabilities: roles.OWNER,
      grantedBy: 'local-bootstrap',
    },
  });
  await tx.auditEvent.create({
    data: {
      actor: 'local-bootstrap',
      action: 'owner.bootstrap',
      resourceId: user.id,
      detail: {},
      requestId: crypto.randomUUID(),
    },
  });
});
console.log('Owner assigned. Sign in again.');
await db.$disconnect();
