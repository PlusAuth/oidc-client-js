import { StateStore } from "./state_store"

export class InMemoryStateStore<T = any> extends StateStore<T> {
  map = new Map()

  clear(before?: number) {
    if (before) {
      this.map.forEach((val, ind) => {
        if (val.created_at < before) {
          this.map.delete(ind)
        }
      })
      return Promise.resolve()
    }
    return Promise.resolve(this.map.clear())
  }

  del(key: string) {
    this.map.delete(key)
    return Promise.resolve()
  }

  get(key: string) {
    return Promise.resolve(this.map.get(key) || null)
  }

  set(key: string, value: any) {
    this.map.set(key, value)
    return Promise.resolve()
  }
}
