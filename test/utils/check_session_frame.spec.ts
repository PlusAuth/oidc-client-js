import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../src/utils/iframe", () => {
  const frame = {
    style: {},
    setAttribute: vi.fn(),
    onload: null,
    contentWindow: { postMessage: vi.fn() },
  }

  return {
    createHiddenFrame: vi.fn(() => frame),
    __mockFrame: frame,
  }
})

// must import AFTER the mock
import { createSessionCheckerFrame } from "../../src/utils/check_session_iframe"
import * as iframeMod from "../../src/utils/iframe"

describe("createSessionCheckerFrame", () => {
  let callback: any
  let frame: any

  beforeEach(() => {
    vi.useFakeTimers()
    vi.restoreAllMocks()

    // restore mock after restoreAllMocks
    frame = {
      style: {},
      setAttribute: vi.fn(),
      onload: null,
      contentWindow: { postMessage: vi.fn() },
    }

    // reapply frame mocks
    // @ts-expect-error
    iframeMod.createHiddenFrame = vi.fn(() => frame)
    // @ts-expect-error
    iframeMod.__mockFrame = frame

    document.body.appendChild = vi.fn()
    window.addEventListener = vi.fn()
    vi.spyOn(globalThis, "setInterval")
    vi.spyOn(globalThis, "clearInterval")

    callback = vi.fn()
  })

  const makeChecker = () =>
    createSessionCheckerFrame({
      url: "https://issuer.com/check",
      client_id: "client123",
      callback,
      checkInterval: 2000,
    })

  it("sets iframe src", () => {
    makeChecker()
    expect(frame.setAttribute).toHaveBeenCalledWith("src", "https://issuer.com/check")
  })

  it("start → loads iframe, posts message, starts interval", async () => {
    const checker = makeChecker()
    frame.onload = vi.fn()

    checker.start("SS1")
    frame.onload()
    await Promise.resolve()

    expect(frame.contentWindow.postMessage).toHaveBeenCalledWith(
      "client123 SS1",
      "https://issuer.com",
    )

    expect(setInterval).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(2000)
    expect(frame.contentWindow.postMessage).toHaveBeenCalledWith(
      "client123 SS1",
      "https://issuer.com",
    )
  })

  it("start → does nothing for identical state", async () => {
    const checker = makeChecker()
    frame.onload = vi.fn()

    checker.start("A")
    frame.onload()
    await Promise.resolve()

    frame.contentWindow.postMessage.mockClear()

    checker.start("A")
    frame.onload()
    await Promise.resolve()

    expect(frame.contentWindow.postMessage).not.toHaveBeenCalled()
  })

  it("stop clears interval", async () => {
    const checker = makeChecker()
    frame.onload = vi.fn()

    checker.start("Z")
    frame.onload()
    await Promise.resolve()

    checker.stop()

    expect(clearInterval).toHaveBeenCalled()
  })

  it("handles 'changed'", async () => {
    const checker = makeChecker()
    frame.onload = vi.fn()

    checker.start("S")
    frame.onload()
    await Promise.resolve()

    // @ts-expect-error
    const handler = window.addEventListener.mock.calls.find((x) => x[0] === "message")[1]

    handler({
      origin: "https://issuer.com",
      source: frame.contentWindow,
      data: "changed",
    })

    expect(clearInterval).toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith()
  })

  it("handles 'error'", async () => {
    const checker = makeChecker()
    frame.onload = vi.fn()

    checker.start("S")
    frame.onload()
    await Promise.resolve()

    // @ts-expect-error
    const handler = window.addEventListener.mock.calls.find((x) => x[0] === "message")[1]

    handler({
      origin: "https://issuer.com",
      source: frame.contentWindow,
      data: "error",
    })

    expect(clearInterval).toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith("error")
  })
})
