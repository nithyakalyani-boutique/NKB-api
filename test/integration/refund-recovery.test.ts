import { it, expect, afterAll } from 'vitest';
import { db } from '../../src/database/db.js';
import { handlePayment } from '../../src/modules/payments.js';
import { requestRefund } from '../../src/modules/operations.js';
import { executeRefund, reconcileRefund } from '../../src/modules/refunds.js';
import { actor, fixture, orderFor, notice } from '../helpers/fixtures.js';
afterAll(() => db.$disconnect());
it('interrupted submissions retain funds and require an audited reconciliation', async () => {
  const f = await fixture(),
    o = await orderFor(actor(), f.variant.id, f.shipping.id);
  await handlePayment(notice(o.attempt));
  const body = {
    amountMinor: String(o.attempt.amountMinor),
    reason: 'Test timeout recovery',
    allocations: [{ amountMinor: String(o.attempt.amountMinor), kind: 'ADJUSTMENT' }],
  };
  const r = await requestRefund(actor(), o.placed.orderId, body);
  await db.refund.update({ where: { id: r.id }, data: { status: 'SUBMITTED' } });
  await executeRefund(r.id);
  await executeRefund(r.id);
  expect((await db.refund.findUnique({ where: { id: r.id } }))?.status).toBe('UNKNOWN');
  expect(
    await db.paymentTransaction.count({ where: { orderId: o.placed.orderId, kind: 'REFUND' } }),
  ).toBe(0);
  await expect(requestRefund(actor(), o.placed.orderId, body)).rejects.toMatchObject({
    code: 'REFUND_LIMIT',
  });
  await reconcileRefund(actor(), r.id, {
    status: 'SUCCEEDED',
    providerReference: String(Date.now()),
    evidence: 'Verified synthetic merchant statement reference in isolated database',
  });
  await executeRefund(r.id);
  expect(
    await db.paymentTransaction.count({
      where: { orderId: o.placed.orderId, kind: 'REFUND', originalId: r.captureId },
    }),
  ).toBe(1);
});
it('duplicate captures are individually refundable without refunding one capture twice', async () => {
  const f = await fixture(),
    o = await orderFor(actor(), f.variant.id, f.shipping.id);
  await handlePayment(notice(o.attempt));
  await handlePayment({ ...notice(o.attempt), providerReference: 'second-' + o.attempt.id });
  const body = {
    amountMinor: String(o.attempt.amountMinor),
    reason: 'Duplicate capture correction',
    allocations: [{ amountMinor: String(o.attempt.amountMinor), kind: 'ADJUSTMENT' }],
  };
  const first = await requestRefund(actor(), o.placed.orderId, body),
    second = await requestRefund(actor(), o.placed.orderId, body);
  expect(first.captureId).not.toBe(second.captureId);
  await executeRefund(first.id);
  await executeRefund(second.id);
  await expect(requestRefund(actor(), o.placed.orderId, body)).rejects.toMatchObject({
    code: 'REFUND_LIMIT',
  });
  expect(
    await db.paymentTransaction.count({ where: { orderId: o.placed.orderId, kind: 'REFUND' } }),
  ).toBe(2);
});
