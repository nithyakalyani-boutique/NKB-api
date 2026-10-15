import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { db } from '../database/db.js';
import { env } from '../config/env.js';
import { found, requireThat } from '../common/problem.js';
import { executeRefund } from '../modules/refunds.js';
export async function processEvent(id: string) {
  const work = found(await db.outboxEvent.findUnique({ where: { id } }));
  if (work.processedAt) return;
  if (work.kind === 'REFUND_REQUESTED') {
    await executeRefund(work.aggregateId);
  } else {
    let recipient = '',
      subject = '',
      body = '';
    if (work.kind === 'AUTH_EMAIL') {
      const p = work.payload as { email: string; subject: string; body: string };
      recipient = p.email;
      subject = p.subject;
      body = p.body;
    } else if (
      ['ORDER_PLACED', 'ORDER_PAID', 'ORDER_SHIPPED', 'REFUND_COMPLETED'].includes(work.kind)
    ) {
      const order = found(await db.order.findUnique({ where: { id: work.aggregateId } }));
      recipient = order.email;
      subject = 'Nithyakalyani Boutique · ' + work.kind.replaceAll('_', ' ');
      body =
        'Order ' +
        order.reference +
        ' — ' +
        work.kind.replaceAll('_', ' ').toLowerCase() +
        '. View your order securely using order access.';
    }
    if (recipient) {
      const notification = await db.notification.upsert({
        where: { eventId: id },
        create: { eventId: id, recipient, subject, body },
        update: {},
      });
      if (notification.status !== 'SENT') {
        if (env.EMAIL_PROVIDER === 'resend') {
          const response = await fetch('https://api.resend.com/emails', {
            signal: AbortSignal.timeout(15000),
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + env.RESEND_API_KEY,
              'Content-Type': 'application/json',
              'Idempotency-Key': id,
            },
            body: JSON.stringify({ from: env.EMAIL_FROM, to: recipient, subject, text: body }),
          });
          requireThat(response.ok, 'EMAIL_PROVIDER_ERROR', 'Email delivery failed.', 503);
          const result = (await response.json()) as { id: string };
          await db.notification.update({
            where: { id: notification.id },
            data: { status: 'SENT', providerId: result.id },
          });
        } else {
          await mkdir(resolve('.local/mailbox'), { recursive: true });
          await writeFile(
            resolve('.local/mailbox', id + '.json'),
            JSON.stringify({ recipient, subject, body }, null, 2),
          );
          await db.notification.update({
            where: { id: notification.id },
            data: { status: 'SENT', providerId: 'local:' + id },
          });
        }
      }
    }
  }
  await db.outboxEvent.update({
    where: { id },
    data: { processedAt: new Date(), leaseUntil: null, lastError: null },
  });
}
