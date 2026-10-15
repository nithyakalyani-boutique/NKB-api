import { z } from 'zod';
const text = z.string(),
  integer = z.number().int(),
  amount = text.regex(/^\d+$/),
  id = z.uuid();
const Money = z.object({ amountMinor: amount, currency: text, exponent: integer });
const Product = z.object({
  id,
  slug: text,
  title: text,
  description: text,
  fabric: text,
  weave: text,
  colour: text,
  occasion: text,
  care: text,
  lengthMm: integer,
  widthMm: integer,
  blouseIncluded: z.boolean(),
  demo: z.boolean(),
  images: z.array(z.object({ url: text, alt: text })),
  variants: z.array(
    z.object({ id, sku: text, title: text, weightG: integer, price: Money, available: integer }),
  ),
});
const Collection = z.object({ id, slug: text, title: text, description: text, image: text });
const Content = z.object({ id, slug: text, title: text, body: text, kind: text, version: integer });
const Cart = z.object({
  id,
  version: integer,
  currency: text,
  coupon: text.nullable(),
  items: z.array(
    z.object({
      id,
      variantId: id,
      title: text,
      slug: text,
      sku: text,
      image: text,
      quantity: integer,
      price: Money,
      lineTotal: Money,
      available: integer,
      active: z.boolean(),
    }),
  ),
  subtotal: Money,
  warnings: z.array(text),
});
const Order = z.object({
  id,
  reference: text,
  email: z.email(),
  createdAt: text,
  status: text,
  paymentSummary: text,
  fulfillmentSummary: text,
  financialFlag: text,
  fulfillmentException: text.nullable(),
  totalMinor: amount,
  shippingMinor: amount,
  discountMinor: amount,
  taxMinor: amount,
  subtotalMinor: amount,
  lines: z.array(
    z.object({
      id,
      title: text,
      sku: text,
      quantity: integer,
      dispatched: integer,
      cancelled: integer,
      returned: integer,
      unitPriceMinor: amount,
      image: text,
    }),
  ),
  shipments: z.array(z.object({ id, carrier: text, trackingNumber: text, status: text })),
  refunds: z.array(z.object({ id, amountMinor: amount, status: text })),
  requests: z.array(z.object({ id, kind: text, status: text })),
});
const StoreConfig = z.object({
  name: text,
  demo: z.boolean(),
  locales: z.array(text),
  currencies: z.array(text),
  shippingCountries: z.array(text),
  termsVersion: text,
  contact: z.object({ email: text.optional(), phone: text.optional() }).nullable(),
});
const Me = z.object({
  user: z.object({
    id: text,
    name: text,
    email: z.email(),
    emailVerified: z.boolean(),
    twoFactorEnabled: z.boolean(),
  }),
  capabilities: z.array(text),
});
const Quote = z.object({
  id,
  expiresAt: text,
  subtotalMinor: amount,
  discountMinor: amount,
  shippingMinor: amount,
  taxMinor: amount,
  totalMinor: amount,
  shippingName: text,
  shippingMethodId: id,
  shippingMethods: z.array(
    z.object({ id, name: text, priceMinor: amount, description: text, dutiesText: text }),
  ),
  total: Money,
});
const Placed = z.object({
  orderId: id,
  paymentAttemptId: id,
  checkout: z.object({ method: text, action: z.url(), fields: z.record(text, text) }),
});
const Problem = z.object({
  type: text,
  title: text,
  status: integer,
  code: text,
  requestId: text,
  errors: z.array(z.object({ field: text, message: text })).optional(),
});
const PageInfo = z.object({ nextCursor: text.nullable(), hasNextPage: z.boolean() });
const page = (item: z.ZodType) =>
  z.object({ items: z.array(item), total: integer.optional(), pageInfo: PageInfo });
export const responseSchemas = {
  Money,
  Product,
  Collection,
  Content,
  Cart,
  Order,
  StoreConfig,
  Me,
  Quote,
  Placed,
  Problem,
  PageInfo,
  ProductsPage: page(Product),
  CollectionsPage: page(Collection),
  ContentPage: page(Content),
};
export function responseName(
  method: string,
  path: string,
): keyof typeof responseSchemas | undefined {
  if (path === 'cart' || path.startsWith('cart/')) return 'Cart';
  const names: Record<string, keyof typeof responseSchemas> = {
    'GET products': 'ProductsPage',
    'GET products/:slug': 'Product',
    'GET search/suggestions': 'ProductsPage',
    'GET collections': 'CollectionsPage',
    'GET collections/:slug': 'Collection',
    'GET content': 'ContentPage',
    'GET content/:slug': 'Content',
    'GET store-config': 'StoreConfig',
    'GET me': 'Me',
    'POST checkout/quotes': 'Quote',
    'POST checkout/orders': 'Placed',
    'GET orders/:id': 'Order',
    'GET admin/orders/:id': 'Order',
    'POST orders/:id/payment-attempts': 'Placed',
  };
  return names[method + ' ' + path];
}
