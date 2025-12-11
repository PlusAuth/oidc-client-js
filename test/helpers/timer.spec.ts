import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Timer } from "../../src/helpers/timer"

describe("timer", () => {
  let now = Date.now()
  const nowFn = () => now

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.resetAllMocks()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe("[constructor]", () => {
    it("should work", () => {
      new Timer()
      new Timer(() => 1000)
    })

    it("should use 1 second if duration is too low", () => {
      const setIntervalSpy = vi.spyOn(global, "setInterval")
      const timer = new Timer()
      timer.start(-1, vi.fn())
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
    })

    it("should use duration", () => {
      const setIntervalSpy = vi.spyOn(global, "setInterval")
      const timer = new Timer()
      timer.start(4, vi.fn())
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 4000)
    })
    it("should stop previous timer if new time is not the same", () => {
      const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval")

      const setIntervalSpy = vi
        .spyOn(globalThis, "setInterval")
        .mockImplementation(() => Math.random() as any)

      const timer = new Timer(nowFn)
      const cb = vi.fn()

      timer.start(4, cb)
      expect(clearIntervalSpy).not.toHaveBeenCalled()

      now = now + 122
      timer.start(4, cb)

      expect(clearIntervalSpy).toHaveBeenCalledTimes(1)

      // cleanup
      setIntervalSpy.mockRestore()
    })

    it("should not stop previous timer if new time is same", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval")
      const timer = new Timer(nowFn)
      const cb = vi.fn()
      timer.start(10, cb)
      expect(clearIntervalSpy).not.toHaveBeenCalled()

      timer.start(10, cb)
      expect(clearIntervalSpy).not.toHaveBeenCalled()
    })
  })

  describe("callback", () => {
    it("should fire when timer expires", () => {
      const timer = new Timer(nowFn)
      const cb = vi.fn()
      timer.start(1, cb)
      expect(cb).toHaveBeenCalledTimes(0)
      now += 1000
      vi.advanceTimersByTime(1000)
      expect(cb).toHaveBeenCalledTimes(1)
    })

    it("should fire if timer late", () => {
      const timer = new Timer(nowFn)
      const cb = vi.fn()
      timer.start(1, cb)
      expect(cb).toHaveBeenCalledTimes(0)
      now += 10000
      vi.advanceTimersByTime(10000)
      expect(cb).toHaveBeenCalledTimes(1)
    })

    it("should stop window timer", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval")

      const timer = new Timer(nowFn)
      const cb = vi.fn()
      timer.start(1, cb)
      expect(cb).toHaveBeenCalledTimes(0)
      now += 10000
      vi.advanceTimersByTime(10000)
      expect(cb).toHaveBeenCalledTimes(1)
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe("cancel", () => {
    it("should stop timer", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval")
      const timer = new Timer(nowFn)
      const cb = vi.fn()
      timer.start(5, cb)
      expect(clearIntervalSpy).not.toHaveBeenCalled()

      timer.stop()
      vi.advanceTimersByTime(10000)
      expect(cb).not.toHaveBeenCalled()
    })

    it("should do nothing if no existing timer", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval")
      const timer = new Timer()

      timer.stop()
      expect(clearIntervalSpy).not.toHaveBeenCalled()
    })
  })
})
