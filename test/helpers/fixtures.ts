import type { Request, Response } from 'express';
import { db, transaction } from '../../src/database/db.js';
import type { Context } from '../../src/common/context.js';
import { changeCart, getCart } from '../../src/modules/cart.js';
import { createQuote, placeOrder } from '../../src/modules/checkout.js';
import { env } from '../../src/config/env.js';
if (!new URL(env.DATABASE_URL).pathname.endsWith('_test'))
  throw Error('Integration tests require a database whose name ends with _test');
export function actor(key = crypto.randomUUID()): Context {
  return {
    actor: 'guest:' + crypto.randomUUID(),
    capabilities: [],
    twoFactorEnabled: false,
    requestId: crypto.randomUUID(),
    req: {
      header: (name: string) => (name === 'Idempotency-Key' ? key : undefined),
      headers: {},
      cookies: {},
    } as unknown as Request,
    res: { cookie: () => {} } as unknown as Response,
  };
}
export async function fixture(stock = 1) {
  return transaction(async (tx) => {
    const warehouse = await tx.warehouse.upsert({
      where: { code: 'LK-TEST' },
      create: { code: 'LK-TEST', name: 'Test stock' },
      update: {},
    });
    const product = await tx.product.create({
      data: {
        slug: 'test-' + crypto.randomUUID(),
        title: 'Test saree',
        description: 'Synthetic integration test saree',
        status: 'ACTIVE',
        publishedAt: new Date(),
        fabric: 'Cotton',
        colour: 'Rose',
        occasion: 'Test',
        care: 'Test fixture only',
        lengthMm: 5500,
        widthMm: 1150,
        images: [{ url: '/images/rose-gold.svg', alt: 'Test textile' }],
        variants: {
          create: {
            sku: 'TEST-' + crypto.randomUUID(),
            title: 'Test',
            optionSignature: 'default',
            weightG: 650,
            priceMinor: 100000n,
            balances: { create: { warehouseId: warehouse.id, onHand: stock } },
          },
        },
      },
      include: { variants: true },
    });
    const v = product.variants[0];
    await tx.inventoryMovement.create({
      data: {
        variantId: v.id,
        warehouseId: warehouse.id,
        onHandDelta: stock,
        reservedDelta: 0,
        kind: 'TEST_RECEIPT',
        sourceId: product.id,
        dedupeKey: 'test:' + v.id,
        reason: 'Isolated test fixture',
        actor: 'test',
      },
    });
    const shipping = await tx.shippingMethod.create({
      data: {
        name: 'Test delivery',
        countries: ['LK'],
        priceMinor: 45000n,
        enabled: true,
        description: 'Test only',
        dutiesText: 'Test only',
      },
    });
    return { product, variant: v, warehouse, shipping };
  });
}
export async function quoteFor(
  ctx: Context,
  variantId: string,
  shippingMethodId: string,
  quantity = 1,
) {
  const cart = await getCart(ctx);
  const updated = await changeCart(ctx, 'add', {
    variantId,
    quantity,
    expectedVersion: cart.version,
  });
  return createQuote(ctx, {
    cartVersion: updated.version,
    locale: 'en',
    email: 'test@example.invalid',
    shippingMethodId,
    shippingAddress: {
      recipient: 'Test Buyer',
      line1: 'Test Street',
      city: 'Colombo',
      country: 'LK',
      phone: '+94770000000',
    },
  });
}
export async function orderFor(
  ctx: Context,
  variantId: string,
  shippingMethodId: string,
  quantity = 1,
) {
  const q = await quoteFor(ctx, variantId, shippingMethodId, quantity);
  const placed = await placeOrder(ctx, { quoteId: q.id, acceptedTermsVersion: 'draft-v1' });
  const attempt = (await db.paymentAttempt.findUnique({ where: { id: placed.paymentAttemptId } }))!;
  return { placed, attempt, quote: q };
}
export const notice = (
  attempt: { merchantReference: string; amountMinor: bigint; currency: string; id: string },
  status = 'SUCCEEDED',
) => ({
  reference: attempt.merchantReference,
  amount: attempt.amountMinor,
  currency: attempt.currency,
  status,
  providerReference: 'test-' + attempt.id,
});
