import { describe, expect, it, vi } from "vitest"

import { OIDCClientError } from "../../src"
import { createHiddenFrame, DefaultIframeAttributes, runIframe } from "../../src/utils"

describe("createHiddenIframe", () => {
  it("should create hidden iframe", () => {
    const iframe = createHiddenFrame()

    expect(iframe).toBeDefined()

    expect(iframe.style.width).toBe("0px")
    expect(iframe.style.height).toBe("0px")
    expect(iframe.style.visibility).toBe("hidden")
    expect(iframe.style.display).toBe("none")
  })
})

describe("runIframe", () => {
  const setup = (customMessage?: MessageEvent) => {
    const iframe = {
      setAttribute: vi.fn(),
      style: { display: "" },
    }
    const url = "https://authorize.com"
    const origin = customMessage?.origin || "https://origin.com"
    window.addEventListener = <any>vi.fn((message, callback) => {
      expect(message).toBe("message")
      callback(customMessage)
    })
    window.removeEventListener = vi.fn()
    window.document.createElement = <any>vi.fn((type) => {
      expect(type).toBe("iframe")
      return iframe
    })
    window.document.body.contains = () => true
    window.document.body.appendChild = vi.fn()
    window.document.body.removeChild = vi.fn()
    return { iframe, url, origin }
  }
  it("handles iframe correctly", async () => {
    const origin = "https://origin.com"
    const message: MessageEvent = {
      origin,
      // @ts-expect-error
      source: { close: vi.fn() },
      data: {
        type: "authorization_response",
        response: { id_token: "id_token" },
      },
    }
    const { iframe, url } = setup(message)
    vi.useFakeTimers()
    await runIframe(url, { eventOrigin: origin })
    vi.runAllTimers()
    // @ts-expect-error
    expect(message.source.close).toHaveBeenCalled()
    expect(window.document.body.appendChild).toHaveBeenCalledWith(iframe)
    expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe)

    expect(iframe.setAttribute.mock.calls).toMatchObject([
      ...Object.entries(DefaultIframeAttributes),
      ["src", url],
    ])
    expect(iframe.style.display).toBe("none")
  })
  describe("with invalid messages", () => {
    ;[
      "",
      {},
      { origin: "other-origin" },
      { data: "test" },
      { data: { type: "other-type" } },
    ].forEach((m) => {
      it(`ignores invalid messages: ${JSON.stringify(m)}`, async () => {
        const { iframe, url, origin } = setup(m as any)
        vi.useFakeTimers()
        const promise = runIframe(url, { eventOrigin: origin })
        vi.runAllTimers()
        await expect(promise).rejects.toThrow(OIDCClientError)
        expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe)
      })
    })
  })
  it("returns authorization response message", async () => {
    const origin = "https://origin.com"
    const message: MessageEvent = {
      origin,
      // @ts-expect-error
      source: { close: vi.fn() },
      data: {
        type: "authorization_response",
        response: { id_token: "id_token" },
      },
    }
    const { iframe, url } = setup(message)
    vi.useFakeTimers()
    await expect(runIframe(url, { eventOrigin: origin })).resolves.toMatchObject(message.data)
    vi.runAllTimers()
    // @ts-expect-error
    expect(message.source!.close).toHaveBeenCalled()
    expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe)
  })

  it("returns authorization error message", async () => {
    const origin = "https://origin.com"

    const message: MessageEvent = {
      origin,
      // @ts-expect-error
      source: { close: vi.fn() },
      data: {
        type: "authorization_response",
        response: {
          error: "error",
          error_description: "error_description",
        },
      },
    }

    const { iframe, url } = setup(message)
    vi.useFakeTimers()
    await expect(runIframe(url, { eventOrigin: origin })).rejects.toThrow(OIDCClientError)
    vi.runAllTimers()
    // @ts-expect-error
    expect(message.source.close).toHaveBeenCalled()
    expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe)
  })

  it("times out after timeout", async () => {
    const { iframe, url, origin } = setup("" as any)
    const timeout = 10
    vi.useFakeTimers()
    const promise = runIframe(url, { eventOrigin: origin, timeout: timeout })
    vi.advanceTimersByTime(timeout * 1000)
    await expect(promise).rejects.toThrow(OIDCClientError)
    expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe)
  })
})
