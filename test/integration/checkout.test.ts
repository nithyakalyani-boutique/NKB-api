import { it, expect, afterAll } from 'vitest';
import { db } from '../../src/database/db.js';
import { placeOrder } from '../../src/modules/checkout.js';
import { changeCart, getCart } from '../../src/modules/cart.js';
import { actor, fixture, quoteFor, orderFor } from '../helpers/fixtures.js';
afterAll(() => db.$disconnect());
it('COM-01 reserves the last saree for at most one shopper', async () => {
  const f = await fixture(1);
  const a = actor(),
    b = actor();
  const [qa, qb] = await Promise.all([
    quoteFor(a, f.variant.id, f.shipping.id),
    quoteFor(b, f.variant.id, f.shipping.id),
  ]);
  const results = await Promise.allSettled([
    placeOrder(a, { quoteId: qa.id, acceptedTermsVersion: 'draft-v1' }),
    placeOrder(b, { quoteId: qb.id, acceptedTermsVersion: 'draft-v1' }),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const balance = await db.inventoryBalance.findFirst({ where: { variantId: f.variant.id } });
  expect(balance?.reserved).toBe(1);
  expect(balance?.onHand).toBe(1);
});
it('COM-03 returns the same outcome for concurrent idempotent requests', async () => {
  const f = await fixture(2),
    a = actor(),
    q = await quoteFor(a, f.variant.id, f.shipping.id);
  const body = { quoteId: q.id, acceptedTermsVersion: 'draft-v1' };
  const [one, two] = await Promise.all([placeOrder(a, body), placeOrder(a, body)]);
  expect(one.orderId).toBe(two.orderId);
  expect(await db.order.count({ where: { actor: a.actor } })).toBe(1);
});
it('COM-04 rejects key reuse for a different payload', async () => {
  const f = await fixture(2),
    a = actor();
  await orderFor(a, f.variant.id, f.shipping.id);
  await expect(
    placeOrder(a, { quoteId: crypto.randomUUID(), acceptedTermsVersion: 'draft-v1' }),
  ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
});
it('rejects stale cart writes', async () => {
  const f = await fixture(),
    a = actor();
  const c = await getCart(a);
  await changeCart(a, 'add', { variantId: f.variant.id, quantity: 1, expectedVersion: c.version });
  await expect(
    changeCart(a, 'add', { variantId: f.variant.id, quantity: 1, expectedVersion: c.version }),
  ).rejects.toMatchObject({ code: 'CART_VERSION_CONFLICT' });
});
it('rejects expired immutable quotes', async () => {
  const f = await fixture(),
    a = actor(),
    q = await quoteFor(a, f.variant.id, f.shipping.id);
  await db.checkoutSession.update({ where: { id: q.id }, data: { quoteExpiresAt: new Date(0) } });
  await expect(
    placeOrder(a, { quoteId: q.id, acceptedTermsVersion: 'draft-v1' }),
  ).rejects.toMatchObject({ code: 'QUOTE_EXPIRED' });
});
it('rejects changed price after quote', async () => {
  const f = await fixture(),
    a = actor(),
    q = await quoteFor(a, f.variant.id, f.shipping.id);
  await db.variant.update({ where: { id: f.variant.id }, data: { priceMinor: 200000n } });
  await expect(
    placeOrder(a, { quoteId: q.id, acceptedTermsVersion: 'draft-v1' }),
  ).rejects.toMatchObject({ code: 'QUOTE_CHANGED' });
});
