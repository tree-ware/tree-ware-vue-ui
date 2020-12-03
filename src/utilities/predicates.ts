export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

export function isString(value: any): value is string {
  return typeof value === 'string'
}
