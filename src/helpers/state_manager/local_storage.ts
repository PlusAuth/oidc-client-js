import { StateStore } from "./state_store"

export class LocalStorageStateStore<T = any> extends StateStore<T> {
  constructor(prefix = "pa_oidc.") {
    super(prefix)
  }

  get(key: string) {
    return new Promise<T | null>((resolve) => {
      const value = window.localStorage.getItem(this.prefix + key)
      if (value) {
        resolve(JSON.parse(value))
      } else {
        resolve(null)
      }
    })
  }

  set(key: string, value: T) {
    return new Promise<void>((resolve) => {
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value))
      resolve()
    })
  }

  del(key: string) {
    return new Promise<void>((resolve) => {
      window.localStorage.removeItem(this.prefix + key)
      resolve()
    })
  }

  clear(before?: number): Promise<void> {
    return new Promise<void>((resolve) => {
      let i
      const storedKeys: string[] = []
      for (i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        // items only created by oidc client
        if (key?.substring(0, this.prefix.length) === this.prefix) {
          storedKeys.push(key)
        }
      }
      for (i = 0; i < storedKeys.length; i++) {
        if (before) {
          try {
            const storedItem = JSON.parse(window.localStorage.getItem(storedKeys[i])!)
            if (storedItem.created_at < before) {
              window.localStorage.removeItem(storedKeys[i])
            }
          } catch (e) {}
        } else {
          window.localStorage.removeItem(storedKeys[i])
        }
      }
      resolve()
    })
  }
}
