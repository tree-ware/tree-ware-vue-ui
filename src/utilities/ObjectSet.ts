/**
 * A set for storing objects only once based on a custom ID function.
 * A Set in TypeScript does not de-duplicate objects, only primitives. Hence
 * the need for this custom class.
 */

export class ObjectSet<T> {
  constructor(private readonly getId: (element: T) => string) {}

  values(): T[] {
    return Object.values(this.set)
  }

  /**
   * Returns true if element has been added to the set, and false if the
   * element already exists in the set and is therefore not added to it
   * again.
   */
  add(element: T): boolean {
    const id = this.getId(element)
    if (this.set[id]) return false
    this.set[id] = element
    return true
  }

  clear() {
    this.set = {}
  }

  private set: { [id: string]: T } = {}
}
