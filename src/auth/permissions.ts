export const roles: Record<string, string[]> = {
  OWNER: ['*'],
  ADMIN: [
    'catalog.read',
    'catalog.write',
    'catalog.publish',
    'content.write',
    'content.publish',
    'inventory.read',
    'inventory.adjust',
    'orders.read',
    'orders.manage',
    'fulfillment.manage',
    'returns.manage',
    'customers.support',
    'promotions.manage',
    'settings.manage',
  ],
  CATALOG_MANAGER: [
    'catalog.read',
    'catalog.write',
    'catalog.publish',
    'content.write',
    'content.publish',
  ],
  FULFILLMENT: ['orders.read', 'inventory.read', 'fulfillment.manage', 'returns.manage'],
  SUPPORT: ['orders.read', 'customers.support'],
  FINANCE: ['orders.read', 'finance.read', 'refunds.issue', 'purchasing.read', 'purchasing.write'],
  ANALYST: ['finance.read', 'inventory.read'],
};
export const can = (capabilities: string[], permission: string) =>
  capabilities.includes('*') || capabilities.includes(permission);
