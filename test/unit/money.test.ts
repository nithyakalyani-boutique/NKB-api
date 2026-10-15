import { describe, it, expect } from 'vitest';
import { minor, decimal, allocate, fx } from '../../src/common/money.js';
describe('exact money', () => {
  it('handles amounts beyond floating point precision', () => {
    expect(minor('90071992547409.91')).toBe(9007199254740991n);
    expect(decimal(1299000n)).toBe('12990.00');
  });
  it.each(['-1', '1.001', '1e3', 'NaN', '', ' 1', '1,000'])('rejects malformed amount %s', (v) =>
    expect(() => minor(v)).toThrow(),
  );
  it('allocates deterministic remainders exactly', () => {
    expect(allocate(10n, [1n, 1n, 1n])).toEqual([4n, 3n, 3n]);
    expect(allocate(1n, [2n, 1n])).toEqual([1n, 0n]);
  });
  it('rounds currency conversion once', () => {
    expect(fx(100n, '3.725')).toBe(373n);
    expect(fx(12345n, '1')).toBe(12345n);
  });
  it('rejects empty allocation and zero rates', () => {
    expect(() => allocate(1n, [])).toThrow();
    expect(() => fx(10n, '0')).toThrow();
  });
});
