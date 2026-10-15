import { db } from '../database/db.js';
import { env } from './env.js';
export async function assertReleaseData() {
  if (env.APP_ENV !== 'production') return;
  if (await db.product.count({ where: { demo: true, status: 'ACTIVE' } }))
    throw Error('Archive demonstration products before production');
  const tax = await db.storeSetting.findUnique({ where: { key: 'tax' } });
  if (!(tax?.value as { approved?: boolean } | null)?.approved)
    throw Error('Production tax treatment must be approved');
  const contact = await db.storeSetting.findUnique({ where: { key: 'contact' } });
  if (!contact) throw Error('Production support contacts must be configured');
  for (const slug of ['terms', 'privacy', 'returns', 'shipping']) {
    const policy = await db.contentPage.findUnique({ where: { slug } });
    if (
      !policy ||
      policy.status !== 'PUBLISHED' ||
      /draft|owner review required|development checkout/i.test(policy.title + ' ' + policy.body)
    )
      throw Error('Publish approved policy: ' + slug);
  }
  if (!(await db.shippingMethod.count({ where: { enabled: true } })))
    throw Error('Production requires approved delivery coverage');
}
