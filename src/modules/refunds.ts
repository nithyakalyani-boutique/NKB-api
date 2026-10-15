import { transaction } from '../database/db.js';
import { env } from '../config/env.js';
import { found, requireThat } from '../common/problem.js';
import { event, audit } from '../common/audit.js';
import type { Context } from '../common/context.js';
import { payHereRefund, type RefundResult } from '../integrations/refunds.js';

export async function finishRefund(
  id: string,
  result: RefundResult,
  actor = 'worker',
  requestId = id,
) {
  return transaction(async (tx) => {
    const refund = found(await tx.refund.findUnique({ where: { id } }));
    if (refund.status === 'SUCCEEDED') return refund;
    requireThat(
      ['REQUESTED', 'SUBMITTED', 'UNKNOWN'].includes(refund.status),
      'REFUND_STATE',
      'Refund is not awaiting a result.',
      409,
    );
    if (result.status === 'SUCCEEDED') {
      const existing = await tx.paymentTransaction.findUnique({
        where: { providerReference: result.reference },
      });
      requireThat(
        !existing,
        'REFUND_REFERENCE_REUSED',
        'Provider reference is already recorded.',
        409,
      );
      const capture = found(
        await tx.paymentTransaction.findFirst({
          where: {
            orderId: refund.orderId,
            attemptId: refund.attemptId,
            kind: 'CAPTURE',
            ...(refund.captureId ? { id: refund.captureId } : {}),
          },
        }),
      );
      await tx.paymentTransaction.create({
        data: {
          orderId: refund.orderId,
          attemptId: refund.attemptId,
          kind: 'REFUND',
          amountMinor: refund.amountMinor,
          currency: refund.currency,
          providerReference: result.reference,
          originalId: capture.id,
        },
      });
      const facts = await tx.paymentTransaction.findMany({ where: { orderId: refund.orderId } });
      const captures = facts
        .filter((f) => f.kind === 'CAPTURE')
        .reduce((s, f) => s + f.amountMinor, 0n);
      const refunds = facts
        .filter((f) => f.kind === 'REFUND')
        .reduce((s, f) => s + f.amountMinor, 0n);
      await tx.order.update({
        where: { id: refund.orderId },
        data: { paymentSummary: refunds >= captures ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
      });
      await event(
        tx,
        'REFUND_COMPLETED',
        refund.orderId,
        { orderId: refund.orderId },
        'refund-email:' + id,
      );
    }
    if (result.status === 'UNKNOWN') {
      const code = 'REFUND_UNKNOWN:' + id;
      if (!(await tx.reconciliationIssue.findFirst({ where: { orderId: refund.orderId, code } })))
        await tx.reconciliationIssue.create({
          data: {
            orderId: refund.orderId,
            attemptId: refund.attemptId,
            code,
            evidence: { refundId: id },
            dueAt: new Date(Date.now() + 86400000),
          },
        });
    }
    const updated = await tx.refund.update({
      where: { id },
      data: {
        status: result.status,
        ...(result.status === 'SUCCEEDED' ? { providerReference: result.reference } : {}),
      },
    });
    await tx.auditEvent.create({
      data: {
        actor,
        action: 'refund.' + result.status.toLowerCase(),
        resourceId: id,
        detail: { provider: env.PAYMENT_PROVIDER },
        requestId,
      },
    });
    return updated;
  });
}
export async function executeRefund(id: string) {
  const claimed = await transaction(async (tx) => {
    const refund = found(await tx.refund.findUnique({ where: { id } }));
    if (['SUCCEEDED', 'FAILED'].includes(refund.status)) return null;
    // An interrupted attempt is reconciled; it is never sent to the provider again.
    if (refund.status !== 'REQUESTED') return { refund, reconcile: true, paymentId: '' };
    const capture = found(
      await tx.paymentTransaction.findFirst({
        where: {
          orderId: refund.orderId,
          attemptId: refund.attemptId,
          kind: 'CAPTURE',
          ...(refund.captureId ? { id: refund.captureId } : {}),
        },
      }),
    );
    await tx.refund.update({ where: { id }, data: { status: 'SUBMITTED' } });
    return {
      refund,
      reconcile: false,
      paymentId: capture.providerReference.replace(/^payhere:capture:/, ''),
    };
  });
  if (!claimed) return;
  if (claimed.reconcile) {
    await finishRefund(id, { status: 'UNKNOWN' });
    return;
  }
  let result: RefundResult;
  if (env.PAYMENT_PROVIDER === 'fake')
    result = { status: 'SUCCEEDED', reference: 'fake-refund:' + id };
  else
    try {
      result = await payHereRefund(
        claimed.paymentId,
        claimed.refund.amountMinor,
        claimed.refund.reason,
      );
    } catch {
      result = { status: 'UNKNOWN' };
    }
  await finishRefund(id, result);
}
export async function reconcileRefund(ctx: Context, id: string, input: Record<string, unknown>) {
  // Finance must independently inspect the merchant statement before using this endpoint.
  const refund = await transaction(async (tx) => {
    const r = found(await tx.refund.findUnique({ where: { id } }));
    requireThat(
      r.status === 'UNKNOWN',
      'REFUND_STATE',
      'Only an uncertain refund can be reconciled.',
      409,
    );
    await audit(tx, ctx, 'refund.reconcile.evidence', id, {
      evidence: input.evidence,
      status: input.status,
    });
    return r;
  });
  return finishRefund(
    refund.id,
    input.status === 'SUCCEEDED'
      ? { status: 'SUCCEEDED', reference: 'payhere:refund:' + String(input.providerReference) }
      : { status: 'FAILED' },
    ctx.actor,
    ctx.requestId,
  );
}
