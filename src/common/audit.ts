import type { Tx } from '../database/db.js';
import { dataJson } from '../database/db.js';
import type { Context } from './context.js';
export async function audit(
  tx: Tx,
  ctx: Context,
  action: string,
  resourceId: string,
  detail: unknown = {},
) {
  await tx.auditEvent.create({
    data: {
      actor: ctx.userId || ctx.actor,
      action,
      resourceId,
      detail: dataJson(detail),
      requestId: ctx.requestId,
    },
  });
}
export async function event(
  tx: Tx,
  kind: string,
  id: string,
  payload: unknown,
  key = kind + ':' + id,
) {
  await tx.outboxEvent.upsert({
    where: { dedupeKey: key },
    create: { kind, aggregateId: id, payload: dataJson(payload), dedupeKey: key },
    update: {},
  });
}
