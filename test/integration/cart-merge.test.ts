import { it, expect, afterAll } from 'vitest';
import { db } from '../../src/database/db.js';
import { hash } from '../../src/common/crypto.js';
import { getCart, changeCart, mergeCart } from '../../src/modules/cart.js';
import { placeOrder } from '../../src/modules/checkout.js';
import { actor, fixture, quoteFor } from '../helpers/fixtures.js';
afterAll(() => db.$disconnect());
it('guest merge caps to stock and cannot duplicate lines on replay', async () => {
  const f = await fixture(3),
    credential = crypto.randomUUID();
  const guest = actor();
  guest.actor = 'guest:' + hash(credential);
  const g = await getCart(guest);
  await changeCart(guest, 'add', {
    variantId: f.variant.id,
    quantity: 2,
    expectedVersion: g.version,
  });
  const user = await db.user.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Merge test',
      email: crypto.randomUUID() + '@example.invalid',
      emailVerified: true,
    },
  });
  const customer = actor();
  customer.userId = user.id;
  customer.actor = 'user:' + user.id;
  customer.req.cookies = { nkb_guest: credential };
  const c = await getCart(customer);
  await changeCart(customer, 'add', {
    variantId: f.variant.id,
    quantity: 2,
    expectedVersion: c.version,
  });
  expect((await mergeCart(customer)).items[0].quantity).toBe(3);
  expect((await mergeCart(customer)).items[0].quantity).toBe(3);
  expect((await db.cart.findUnique({ where: { id: g.id } }))?.status).toBe('ABANDONED');
});
it('stale purchase terms cannot create orders or stock holds', async () => {
  const f = await fixture(),
    ctx = actor(),
    quote = await quoteFor(ctx, f.variant.id, f.shipping.id);
  await expect(
    placeOrder(ctx, { quoteId: quote.id, acceptedTermsVersion: 'obsolete' }),
  ).rejects.toMatchObject({ code: 'TERMS_CHANGED' });
  expect(await db.order.count({ where: { checkoutId: quote.id } })).toBe(0);
  expect(
    (await db.inventoryBalance.findFirst({ where: { variantId: f.variant.id } }))?.reserved,
  ).toBe(0);
});
