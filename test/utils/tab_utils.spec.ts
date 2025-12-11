import { beforeEach, describe, expect, it, vi } from "vitest"
import { TabUtils } from "../../src/utils/tab_utils"

function removeLocalStorage() {
  Object.defineProperty(window, "localStorage", {
    value: undefined,
    configurable: true,
    writable: true,
  })
}

describe("TabUtils", () => {
  let tab: TabUtils
  let events: any
  let ls: Storage

  beforeEach(() => {
    vi.useFakeTimers()

    // mock events emitter
    events = { emit: vi.fn(), on: vi.fn() }

    // mock localStorage
    ls = {
      store: {} as Record<string, string>,
      setItem: vi.fn(function (this: any, k, v) {
        this.store[k] = v
      }),
      getItem: vi.fn(function (this: any, k) {
        return this.store[k]
      }),
      removeItem: vi.fn(function (this: any, k) {
        delete this.store[k]
      }),
    } as any

    Object.defineProperty(window, "localStorage", {
      value: ls,
      writable: true,
    })

    tab = new TabUtils("test:", events)
  })

  // ---------------------------------------------------------------------------
  // CALLONCE
  // ---------------------------------------------------------------------------

  it("CallOnce → runs function immediately when localStorage is missing", () => {
    removeLocalStorage()

    const fn = vi.fn()
    tab.CallOnce("lock1", fn)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("CallOnce → the tab that owns the lock executes the function", () => {
    const fn = vi.fn()

    tab.CallOnce("lock1", fn)

    // First timeout triggers re-read
    vi.advanceTimersByTime(150)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("CallOnce → non-owner tabs should NOT execute function", () => {
    const fn = vi.fn()

    tab.CallOnce("lock1", fn)

    //  Overwrite AFTER CallOnce has written currentTabId
    ls.store["test:lock1"] = "otherTabId"

    // Now advance timer → this tab should NOT run fn
    vi.advanceTimersByTime(150)

    expect(fn).not.toHaveBeenCalled()
  })

  it("CallOnce → lock is cleaned after timeout", () => {
    tab.CallOnce("lock1", () => {}, 3000)

    expect(ls.removeItem).not.toHaveBeenCalled()

    vi.advanceTimersByTime(3000)

    expect(ls.removeItem).toHaveBeenCalledWith("test:lock1")
  })

  // ---------------------------------------------------------------------------
  // BROADCAST
  // ---------------------------------------------------------------------------

  it("BroadcastMessageToAllTabs → calls local handler immediately", () => {
    const localHandler = vi.fn()
    tab.OnBroadcastMessage("PING", localHandler)

    tab.BroadcastMessageToAllTabs("PING", { a: 1 })

    expect(localHandler).toHaveBeenCalledWith({ a: 1 })
  })

  it("BroadcastMessageToAllTabs → writes message to localStorage", () => {
    tab.OnBroadcastMessage("MSG", vi.fn())

    tab.BroadcastMessageToAllTabs("MSG", { hello: true })

    expect(ls.setItem).toHaveBeenCalledWith(
      "test:eventMSG",
      expect.stringContaining('"data":{"hello":true}'),
    )
  })

  it("BroadcastMessageToAllTabs → removes event key after cleanup", () => {
    tab.OnBroadcastMessage("MSG", vi.fn())

    tab.BroadcastMessageToAllTabs("MSG", { x: 1 })
    expect(ls.removeItem).not.toHaveBeenCalled()

    vi.advanceTimersByTime(3000)

    expect(ls.removeItem).toHaveBeenCalledWith("test:eventMSG")
  })

  it("BroadcastMessageToAllTabs → falls back to events.emit when localStorage missing", () => {
    removeLocalStorage()

    const tab2 = new TabUtils("test:", events)

    tab2.BroadcastMessageToAllTabs("PING", 42)

    expect(events.emit).toHaveBeenCalledWith("PING", 42)
  })

  // ---------------------------------------------------------------------------
  // ONBROADCAST
  // ---------------------------------------------------------------------------

  it("OnBroadcastMessage → registers handler and consumes storage events", () => {
    const handler = vi.fn()
    tab.OnBroadcastMessage("ALERT", handler)

    const payload = { data: { x: 1 }, timeStamp: 123 }

    // simulate broadcast from another tab
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "test:eventALERT",
        newValue: JSON.stringify(payload),
      }),
    )

    expect(handler).toHaveBeenCalledWith({ x: 1 })
  })

  it("OnBroadcastMessage → ignores unrelated storage keys", () => {
    const handler = vi.fn()
    tab.OnBroadcastMessage("HELLO", handler)

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "other", // should be ignored
        newValue: JSON.stringify({ data: 1 }),
      }),
    )

    expect(handler).not.toHaveBeenCalled()
  })

  it("OnBroadcastMessage → ignores null newValue (cleanup event)", () => {
    const handler = vi.fn()
    tab.OnBroadcastMessage("AAA", handler)

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "test:eventAAA",
        newValue: null, // cleanup
      }),
    )

    expect(handler).not.toHaveBeenCalled()
  })

  it("OnBroadcastMessage fallback → uses events.on for no localStorage", () => {
    removeLocalStorage()

    const tab2 = new TabUtils("test:", events)
    const handler = vi.fn()

    tab2.OnBroadcastMessage("HELLO", handler)

    expect(events.on).toHaveBeenCalledWith("HELLO", handler)
  })
})
