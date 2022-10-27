import {Timer} from "../../src/helpers/timer";

describe("timer", function () {
  let now = Date.now()
  const nowFn = () => now

  beforeEach(()=>{
    jest.useFakeTimers({legacyFakeTimers: true});
  })

  afterEach(()=>{
    jest.clearAllTimers()
    jest.resetAllMocks()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe("[constructor]", function () {

    it("should work", function () {
      new Timer()
      new Timer(()=> 1000)
    });

    it("should use 1 second if duration is too low", function () {
      const setIntervalSpy = jest.spyOn(global, 'setInterval')
      const timer = new Timer()
      timer.start(-1, jest.fn())
      expect(setIntervalSpy).toBeCalledWith(expect.any(Function), 1000)
    });

    it("should use duration", function () {
      const setIntervalSpy = jest.spyOn(global, 'setInterval')
      const timer = new Timer()
      timer.start(4, jest.fn())
      expect(setIntervalSpy).toBeCalledWith(expect.any(Function), 4000)
    });

    it("should stop previous timer if new time is not the same", function () {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      const setIntervalMock = (setInterval as jest.Mock);
      setIntervalMock.mockImplementation(() => Math.random());
      const timer = new Timer(nowFn)
      const cb =jest.fn()
      timer.start(4, cb)
      expect(clearIntervalSpy).not.toBeCalled()

      now = now + 122;
      timer.start(4, cb)
      expect(clearIntervalSpy).toBeCalledTimes(1)
    });

    it("should not stop previous timer if new time is same", function () {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      const timer = new Timer(nowFn)
      const cb =jest.fn()
      timer.start(10, cb)
      expect(clearIntervalSpy).not.toBeCalled()

      timer.start(10, cb)
      expect(clearIntervalSpy).not.toBeCalled()
    });
  });

  describe("callback", function () {

    it("should fire when timer expires", function () {
      const timer = new Timer(nowFn)
      const cb = jest.fn()
      timer.start(1, cb)
      expect(cb).toBeCalledTimes(0)
      now += 1000
      jest.advanceTimersByTime(1000)
      expect(cb).toBeCalledTimes(1)
    });


    it("should fire if timer late", function () {
      const timer = new Timer(nowFn)
      const cb = jest.fn()
      timer.start(1, cb)
      expect(cb).toBeCalledTimes(0)
      now += 10000
      jest.advanceTimersByTime(10000)
      expect(cb).toBeCalledTimes(1)
    });

    it("should stop window timer", function () {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      const timer = new Timer(nowFn)
      const cb = jest.fn()
      timer.start(1, cb)
      expect(cb).toBeCalledTimes(0)
      now += 10000
      jest.advanceTimersByTime(10000)
      expect(cb).toBeCalledTimes(1)
      expect(clearIntervalSpy).toBeCalledTimes(1)
    });
  });

  describe("cancel", function () {

    it("should stop timer", function () {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      const timer = new Timer(nowFn)
      const cb = jest.fn()
      timer.start(5, cb)
      expect(clearIntervalSpy).not.toBeCalled()

      timer.stop()
      jest.advanceTimersByTime(10000)
      expect(cb).not.toBeCalled()
    });

    it("should do nothing if no existing timer", function () {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      const timer = new Timer()

      timer.stop()
      expect(clearIntervalSpy).not.toBeCalled()
    });
  });

});
