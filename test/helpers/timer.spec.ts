import { Timer } from "../../src/helpers/timer"

describe("timer", () => {
  let now = Date.now()
  const nowFn = () => now

  beforeEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: true })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.resetAllMocks()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe("[constructor]", () => {
    it("should work", () => {
      new Timer()
      new Timer(() => 1000)
    })

    it("should use 1 second if duration is too low", () => {
      const setIntervalSpy = jest.spyOn(global, "setInterval")
      const timer = new Timer()
      timer.start(-1, jest.fn())
      expect(setIntervalSpy).toBeCalledWith(expect.any(Function), 1000)
    })

    it("should use duration", () => {
      const setIntervalSpy = jest.spyOn(global, "setInterval")
      const timer = new Timer()
      timer.start(4, jest.fn())
      expect(setIntervalSpy).toBeCalledWith(expect.any(Function), 4000)
    })

    it("should stop previous timer if new time is not the same", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval")
      const setIntervalMock = setInterval as any as jest.Mock
      setIntervalMock.mockImplementation(() => Math.random())
      const timer = new Timer(nowFn)
      const cb = jest.fn()
      timer.start(4, cb)
      expect(clearIntervalSpy).not.toBeCalled()

      now = now + 122
      timer.start(4, cb)
      expect(clearIntervalSpy).toBeCalledTimes(1)
    })

    it("should not stop previous timer if new time is same", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval")
      const timer = new Timer(nowFn)
      const cb = jest.fn()
      timer.start(10, cb)
      expect(clearIntervalSpy).not.toBeCalled()

      timer.start(10, cb)
      expect(clearIntervalSpy).not.toBeCalled()
    })
  })

  describe("callback", () => {
    it("should fire when timer expires", () => {
      const timer = new Timer(nowFn)
      const cb = jest.fn()
      timer.start(1, cb)
      expect(cb).toBeCalledTimes(0)
      now += 1000
      jest.advanceTimersByTime(1000)
      expect(cb).toBeCalledTimes(1)
    })

    it("should fire if timer late", () => {
      const timer = new Timer(nowFn)
      const cb = jest.fn()
      timer.start(1, cb)
      expect(cb).toBeCalledTimes(0)
      now += 10000
      jest.advanceTimersByTime(10000)
      expect(cb).toBeCalledTimes(1)
    })

    it("should stop window timer", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval")

      const timer = new Timer(nowFn)
      const cb = jest.fn()
      timer.start(1, cb)
      expect(cb).toBeCalledTimes(0)
      now += 10000
      jest.advanceTimersByTime(10000)
      expect(cb).toBeCalledTimes(1)
      expect(clearIntervalSpy).toBeCalledTimes(1)
    })
  })

  describe("cancel", () => {
    it("should stop timer", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval")
      const timer = new Timer(nowFn)
      const cb = jest.fn()
      timer.start(5, cb)
      expect(clearIntervalSpy).not.toBeCalled()

      timer.stop()
      jest.advanceTimersByTime(10000)
      expect(cb).not.toBeCalled()
    })

    it("should do nothing if no existing timer", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval")
      const timer = new Timer()

      timer.stop()
      expect(clearIntervalSpy).not.toBeCalled()
    })
  })
})
