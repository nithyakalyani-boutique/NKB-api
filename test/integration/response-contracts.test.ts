import { it, expect, afterAll } from 'vitest';
import { db, dataJson } from '../../src/database/db.js';
import { responseSchemas } from '../../src/contracts/responses.js';
import { product } from '../../src/modules/catalogue.js';
import { getCart } from '../../src/modules/cart.js';
import { orderView } from '../../src/modules/orders.js';
import { actor, fixture, orderFor } from '../helpers/fixtures.js';
afterAll(() => db.$disconnect());
it('serializes product cart and order views to the generated commerce contract', async () => {
  const f = await fixture(),
    ctx = actor();
  expect(responseSchemas.Product.safeParse(dataJson(await product(f.product.slug))).success).toBe(
    true,
  );
  expect(responseSchemas.Cart.safeParse(dataJson(await getCart(ctx))).success).toBe(true);
  const result = await orderFor(ctx, f.variant.id, f.shipping.id);
  expect(responseSchemas.Placed.safeParse(dataJson(result.placed)).success).toBe(true);
  expect(
    responseSchemas.Order.safeParse(dataJson(await orderView(ctx, result.placed.orderId))).success,
  ).toBe(true);
});
