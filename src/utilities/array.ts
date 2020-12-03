/**
 * Partitions the specified array into two arrays.
 *
 * The two partitioned arrays are returned as elements of a tuple.
 * If the predicate returns `true`, the element will be in the first array,
 * else it will be in the second array.
 */
export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const passed: T[] = []
  const failed: T[] = []
  array.forEach(item => {
    predicate(item) ? passed.push(item) : failed.push(item)
  })
  return [passed, failed]
}

/**
 * Returns the specified element in an array if it exists.
 * Returns an empty array if the element does not exist.
 */
export function arrayIf<T>(element: T | undefined | null): T[] {
  return element ? [element] : []
}
