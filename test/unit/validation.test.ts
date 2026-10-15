import { it, expect } from 'vitest';
import { cartItem } from '../../src/contracts/cartItem.js';
import { quote } from '../../src/contracts/quote.js';
import { refund } from '../../src/contracts/refund.js';
import { canonical } from '../../src/common/crypto.js';
it('rejects client-selected prices and principals', () => {
  expect(
    cartItem.safeParse({
      variantId: crypto.randomUUID(),
      quantity: 1,
      expectedVersion: 1,
      priceMinor: '1',
      actor: 'owner',
    }).success,
  ).toBe(false);
});
it.each([0, -1, 1.5, 21, Infinity])('rejects unsafe cart quantity %s', (quantity) => {
  expect(
    cartItem.safeParse({ variantId: crypto.randomUUID(), quantity, expectedVersion: 1 }).success,
  ).toBe(false);
});
it('canonicalizes database JSON without changing values', () => {
  expect(canonical({ b: 1, a: { z: 2, y: 3 } })).toBe(canonical({ a: { y: 3, z: 2 }, b: 1 }));
});
it('requires delivery address and terms context through quote schema', () => {
  expect(
    quote.safeParse({ email: 'x@example.com', cartVersion: 1, locale: 'en', totalMinor: '1' })
      .success,
  ).toBe(false);
});
it('rejects zero refunds', () => {
  expect(refund.safeParse({ amountMinor: '0', reason: 'reason', allocations: [] }).success).toBe(
    false,
  );
});
