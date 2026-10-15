import { db, transaction, dataJson } from '../src/database/db.js';
import { env } from '../src/config/env.js';
if (!['local', 'test'].includes(env.APP_ENV))
  throw Error('Demo seed is restricted to local and test environments');
const fixtures = [
  [
    'rose-gold',
    'The Rose Edit',
    'Rose',
    'Silk blend',
    'Celebration',
    1890000,
    '#97364e',
    '#d7a866',
  ],
  [
    'emerald-evening',
    'Emerald Evening',
    'Green',
    'Silk blend',
    'Wedding',
    2450000,
    '#214b41',
    '#c49951',
  ],
  ['ivory-poetry', 'Ivory Poetry', 'Ivory', 'Cotton', 'Everyday', 890000, '#ded4b4', '#ad8954'],
  [
    'midnight-bloom',
    'Midnight Bloom',
    'Blue',
    'Silk blend',
    'Celebration',
    1690000,
    '#263653',
    '#bdb0c3',
  ],
  ['saffron-light', 'Saffron Light', 'Yellow', 'Cotton', 'Everyday', 990000, '#d8a349', '#a34135'],
  [
    'blush-morning',
    'Blush Morning',
    'Pink',
    'Linen blend',
    'Everyday',
    1250000,
    '#c28b8c',
    '#e6c8b4',
  ],
  [
    'plum-reverie',
    'Plum Reverie',
    'Purple',
    'Silk blend',
    'Wedding',
    2290000,
    '#63415f',
    '#c6a35c',
  ],
  [
    'terracotta-story',
    'Terracotta Story',
    'Orange',
    'Cotton',
    'Celebration',
    1150000,
    '#ab5740',
    '#e0b778',
  ],
  ['ocean-note', 'Ocean Note', 'Blue', 'Linen blend', 'Everyday', 1390000, '#477777', '#d2b68c'],
  ['golden-hour', 'Golden Hour', 'Gold', 'Silk blend', 'Wedding', 2690000, '#c09747', '#6f2532'],
  ['forest-whisper', 'Forest Whisper', 'Green', 'Cotton', 'Everyday', 950000, '#59694a', '#c8ab73'],
  [
    'wine-and-wonder',
    'Wine & Wonder',
    'Maroon',
    'Silk blend',
    'Wedding',
    2590000,
    '#681f30',
    '#c79b58',
  ],
];
await transaction(async (tx) => {
  const warehouse = await tx.warehouse.upsert({
    where: { code: 'LK-MAIN' },
    create: { code: 'LK-MAIN', name: 'Sri Lanka · demonstration stockroom' },
    update: {},
  });
  for (const [index, item] of fixtures.entries()) {
    const [slug, title, colour, fabric, occasion, amount] = item;
    const p = await tx.product.upsert({
      where: { slug: String(slug) },
      create: {
        slug: String(slug),
        title: String(title),
        description:
          'Demonstration catalogue piece exploring ' +
          String(colour).toLowerCase() +
          ' tones and a considered border. The illustrated textile is a design fixture, not a sale photograph. Material details and dimensions are sample data pending owner approval.',
        fabric: String(fabric),
        colour: String(colour),
        occasion: String(occasion),
        weave: 'Sample woven finish',
        care: 'Sample care guidance: follow the verified garment care label. Keep folded in a dry, ventilated space.',
        lengthMm: 5500,
        widthMm: 1150,
        blouseIncluded: true,
        demo: true,
        status: 'ACTIVE',
        publishedAt: new Date(Date.now() - index * 86400000),
        images: dataJson([
          { url: '/images/' + slug + '.svg', alt: title + ' — demonstration textile illustration' },
        ]),
        variants: {
          create: {
            sku: 'DEMO-' + String(index + 1).padStart(3, '0'),
            title: 'Unstitched saree',
            optionSignature: 'default',
            weightG: 650,
            priceMinor: BigInt(amount),
            balances: { create: { warehouseId: warehouse.id, onHand: 8 } },
          },
        },
      },
      update: {},
      include: { variants: true },
    });
    const variant = p.variants[0];
    await tx.inventoryMovement.upsert({
      where: { dedupeKey: 'seed:' + variant.id },
      create: {
        variantId: variant.id,
        warehouseId: warehouse.id,
        onHandDelta: 8,
        reservedDelta: 0,
        kind: 'DEMO_RECEIPT',
        sourceId: p.id,
        dedupeKey: 'seed:' + variant.id,
        reason: 'Explicit synthetic development stock',
        actor: 'seed',
      },
      update: {},
    });
  }
  for (const [slug, title, description, image] of [
    [
      'everyday',
      'Everyday, beautifully',
      'Easy drapes for the moments that make a day.',
      'ivory-poetry',
    ],
    [
      'celebration',
      'Made for a moment',
      'Colour and texture for your next celebration.',
      'rose-gold',
    ],
    [
      'wedding',
      'The occasion edit',
      'Considered sarees for gathering and celebration.',
      'emerald-evening',
    ],
  ]) {
    const c = await tx.collection.upsert({
      where: { slug },
      create: { slug, title, description, image: '/images/' + image + '.svg', status: 'PUBLISHED' },
      update: {},
    });
    const rows = await tx.product.findMany({
      where: {
        occasion: slug === 'everyday' ? 'Everyday' : slug === 'wedding' ? 'Wedding' : 'Celebration',
      },
    });
    for (const [position, p] of rows.entries())
      await tx.collectionProduct.upsert({
        where: { collectionId_productId: { collectionId: c.id, productId: p.id } },
        create: { collectionId: c.id, productId: p.id, position },
        update: {},
      });
  }
  if (!(await tx.shippingMethod.count()))
    await tx.shippingMethod.create({
      data: {
        name: 'Sri Lanka delivery · demo',
        countries: ['LK'],
        priceMinor: 45000,
        enabled: true,
        description: 'Development rate only. Dispatch estimates require merchant approval.',
        dutiesText: 'Local development fixture. International destinations are disabled.',
      },
    });
  await tx.storeSetting.upsert({
    where: { key: 'tax' },
    create: {
      key: 'tax',
      value: {
        basisPoints: 0,
        status: 'DEMO_ONLY',
        treatment: 'Exclusive; no approved tax rules configured',
      },
    },
    update: {},
  });
});
console.log('Synthetic catalogue seeded without creating staff credentials.');
await db.$disconnect();

// Content seeding uses a fresh connection because the catalogue seed disconnects cleanly.
const contentFixtures = await import('./content-fixtures.js');
for (const fixture of Object.values(contentFixtures))
  await db.contentPage.upsert({ where: { slug: fixture.slug }, create: fixture, update: {} });
await db.$disconnect();
