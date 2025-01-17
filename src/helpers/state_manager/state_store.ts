export interface StateStore<T = Record<string, any>> {
  init?(): Promise<StateStore<T>>
}
// biome-ignore  lint/suspicious/noUnsafeDeclarationMerging:
export abstract class StateStore<T = Record<string, any>> {
  prefix: string

  constructor(prefix = "") {
    this.prefix = prefix
  }

  public abstract get(key: string): Promise<T | null>

  public abstract set(key: string, value: T): Promise<void>

  public abstract del(key: string): Promise<void>

  public abstract clear(maxAge?: number): Promise<void>
}
