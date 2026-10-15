export class Problem extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function requireThat(
  value: unknown,
  code: string,
  message: string,
  status = 422,
): asserts value {
  if (!value) throw new Problem(status, code, message);
}
export function found<T>(value: T | null | undefined): T {
  if (value === null || value === undefined)
    throw new Problem(404, 'NOT_FOUND', 'This resource is not available.');
  return value;
}
