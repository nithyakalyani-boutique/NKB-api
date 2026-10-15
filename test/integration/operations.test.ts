import { it, expect, afterAll } from 'vitest';
import { db } from '../../src/database/db.js';
import { handlePayment } from '../../src/modules/payments.js';
import {
  createShipment,
  dispatch,
  requestRefund,
  createPurchase,
  receivePurchase,
} from '../../src/modules/operations.js';
import { processEvent } from '../../src/jobs/process.js';
import { actor, fixture, orderFor, notice } from '../helpers/fixtures.js';
afterAll(() => db.$disconnect());
it('COM-13 partial dispatch retains allocation and replays safely', async () => {
  const f = await fixture(3),
    a = actor(),
    o = await orderFor(a, f.variant.id, f.shipping.id, 3);
  await handlePayment(notice(o.attempt));
  const line = (await db.orderLine.findFirst({ where: { orderId: o.placed.orderId } }))!;
  const shipment = await createShipment(actor(), o.placed.orderId, {
    carrier: 'Test carrier',
    trackingNumber: 'TEST-1',
    items: [{ orderLineId: line.id, quantity: 1 }],
  });
  await dispatch(actor(), shipment.id);
  await dispatch(actor(), shipment.id);
  const stock = await db.inventoryBalance.findFirst({ where: { variantId: f.variant.id } });
  expect(stock?.onHand).toBe(2);
  expect(stock?.reserved).toBe(2);
  expect((await db.order.findUnique({ where: { id: o.placed.orderId } }))?.fulfillmentSummary).toBe(
    'PARTIALLY_FULFILLED',
  );
});
it('COM-11 concurrent refunds cannot exceed captured funds', async () => {
  const f = await fixture(),
    o = await orderFor(actor(), f.variant.id, f.shipping.id);
  await handlePayment(notice(o.attempt));
  const body = {
    amountMinor: String(o.attempt.amountMinor),
    reason: 'Test refund reason',
    allocations: [{ amountMinor: String(o.attempt.amountMinor), kind: 'ADJUSTMENT' }],
  };
  const results = await Promise.allSettled([
    requestRefund(actor(), o.placed.orderId, body),
    requestRefund(actor(), o.placed.orderId, body),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const job = (await db.outboxEvent.findFirst({
    where: {
      kind: 'REFUND_REQUESTED',
      aggregateId: (await db.refund.findFirst({ where: { orderId: o.placed.orderId } }))!.id,
    },
  }))!;
  await processEvent(job.id);
  await processEvent(job.id);
  expect(
    await db.paymentTransaction.count({ where: { orderId: o.placed.orderId, kind: 'REFUND' } }),
  ).toBe(1);
  expect(
    (await db.inventoryBalance.findFirst({ where: { variantId: f.variant.id } }))?.onHand,
  ).toBe(1);
});
it('COM-15 receipt replay does not double stock or landed cost', async () => {
  const f = await fixture(0);
  const supplier = await db.supplier.create({ data: { name: 'Test supplier' } });
  const po = await createPurchase(actor(), {
    supplierId: supplier.id,
    currency: 'INR',
    lines: [{ variantId: f.variant.id, quantity: 3, unitCostMinor: '10000' }],
  });
  const a = actor();
  const body = {
    fxRate: '3.5',
    chargesMinor: '100',
    noFurtherCharges: true,
    lines: [{ purchaseLineId: po.lines[0].id, quantity: 2 }],
  };
  await receivePurchase(a, po.id, body);
  await receivePurchase(a, po.id, body);
  expect(
    (await db.inventoryBalance.findFirst({ where: { variantId: f.variant.id } }))?.onHand,
  ).toBe(2);
  const receipt = await db.receiptLine.findFirst({ where: { variantId: f.variant.id } });
  expect(receipt?.unitLandedMinor).toBe(35050n);
  expect((await db.purchaseOrder.findUnique({ where: { id: po.id } }))?.status).toBe(
    'PARTIALLY_RECEIVED',
  );
});
