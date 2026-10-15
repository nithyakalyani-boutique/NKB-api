import { it, expect, afterAll } from 'vitest';
import { db } from '../../src/database/db.js';
import { ownedOrder, requestAccess, exchangeAccess } from '../../src/modules/orders.js';
import { actor, fixture, orderFor } from '../helpers/fixtures.js';
afterAll(() => db.$disconnect());
it('SEC-01 denies another guest order', async () => {
  const f = await fixture(),
    a = actor(),
    o = await orderFor(a, f.variant.id, f.shipping.id);
  await expect(ownedOrder(actor(), o.placed.orderId)).rejects.toMatchObject({ status: 404 });
  expect((await ownedOrder(a, o.placed.orderId)).id).toBe(o.placed.orderId);
});
it('SEC-02 recovery response never exposes order details', async () => {
  const response = await requestAccess({
    reference: 'not-an-order',
    email: 'nobody@example.invalid',
  });
  expect(Object.keys(response).sort()).toEqual(['challengeId', 'message']);
});
it('SEC-06 consumes failed challenge attempts even when exchange fails', async () => {
  const c = await requestAccess({ reference: 'no-order', email: 'nobody@example.invalid' });
  for (let n = 0; n < 6; n++)
    await expect(
      exchangeAccess(actor(), { challengeId: c.challengeId, code: '0'.repeat(64) }),
    ).rejects.toMatchObject({ code: 'INVALID_CODE' });
  expect((await db.guestChallenge.findUnique({ where: { id: c.challengeId } }))?.attempts).toBe(5);
});
