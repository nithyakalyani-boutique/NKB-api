import { it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { initiationHash, notificationHash } from '../../src/integrations/payments.js';
const upper = (s: string) => createHash('md5').update(s).digest('hex').toUpperCase();
it('uses the documented hosted-initiation checksum fields', () => {
  expect(initiationHash('merchant', 'attempt', '1200.00', 'LKR', 'secret')).toBe(
    upper('merchantattempt1200.00LKR' + upper('secret')),
  );
});
it('binds callback checksum to provider status', () => {
  const a = notificationHash('m', 'o', '1200.00', 'LKR', '2', 'secret');
  expect(a).not.toBe(notificationHash('m', 'o', '1200.00', 'LKR', '0', 'secret'));
  expect(a).not.toBe(notificationHash('m', 'o', '1201.00', 'LKR', '2', 'secret'));
});
