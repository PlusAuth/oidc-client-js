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
describe("DefaultIframeAttributes customization", () => {
  it("should allow modifying DefaultIframeAttributes before creating iframe", () => {
    // Backup original defaults
    const original = { ...DefaultIframeAttributes }

    // Modify attributes (simulate application customization)
    DefaultIframeAttributes["data-custom"] = "custom-value"
    DefaultIframeAttributes.title = "custom-title"

    // Create iframe AFTER modifications
    const iframe = createHiddenFrame()

    // Validate modifications appear on the iframe
    expect(iframe.getAttribute("data-custom")).toBe("custom-value")
    expect(iframe.getAttribute("title")).toBe("custom-title")

    // Clean up: restore original values
    for (const key of Object.keys(DefaultIframeAttributes)) {
      delete (DefaultIframeAttributes as any)[key]
    }
    Object.assign(DefaultIframeAttributes, original)
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

  it("clears onLoadTimeoutId when removing iframe", async () => {
    const origin = "https://origin.com"

    const { iframe, url } = (function setupOnLoadTimeout() {
      const iframe: any = {
        setAttribute: vi.fn(),
        style: {},
      }
      window.document.createElement = vi.fn(() => iframe)
      window.document.body.appendChild = vi.fn()
      window.document.body.removeChild = vi.fn()
      window.document.body.contains = () => true
      window.addEventListener = vi.fn()
      window.removeEventListener = vi.fn()

      return { iframe, url: "https://auth.com" }
    })()

    vi.useFakeTimers()

    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")

    const promise = runIframe(url, { eventOrigin: origin })

    iframe.onload!()

    vi.runOnlyPendingTimers()

    await expect(promise).rejects.toThrow(OIDCClientError)

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it("onLoadTimeout rejects with correct error and removes iframe", async () => {
    const origin = "https://origin.com"
    const url = "https://auth.com"

    const iframe: any = {
      setAttribute: vi.fn(),
      style: {},
    }

    window.document.createElement = vi.fn(() => iframe)
    window.document.body.contains = () => true
    window.document.body.appendChild = vi.fn()
    window.document.body.removeChild = vi.fn()
    window.addEventListener = vi.fn()
    window.removeEventListener = vi.fn()

    vi.useFakeTimers()

    // Prevent outer timeout from ever being scheduled.
    // detect outer timeout by its message argument.
    const realSetTimeout = global.setTimeout
    const setTimeoutSpy = vi
      .spyOn(global, "setTimeout")
      .mockImplementation((fn: any, delay?: number): any => {
        const fnString = fn?.toString()

        // Skip registering the outer "Timed out" handler
        if (fnString?.includes("Timed out")) {
          return 99999 // dummy ID
        }

        // Allow inner onLoadTimeout to register normally
        return realSetTimeout(fn, delay)
      })

    const promise = runIframe(url, { eventOrigin: origin })

    iframe.onload!()

    vi.runOnlyPendingTimers()

    await expect(promise).rejects.toThrowError(
      new OIDCClientError("Could not complete silent authentication", url),
    )
    expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe)

    setTimeoutSpy.mockRestore()
  })

  it("stores onLoadTimeoutId when iframe.onload triggers onLoadTimeout()", async () => {
    const origin = "https://origin.com"
    const url = "https://auth.com"

    const iframe: any = {
      setAttribute: vi.fn(),
      style: {},
    }

    window.document.createElement = vi.fn(() => iframe)
    window.document.body.appendChild = vi.fn()
    window.document.body.removeChild = vi.fn()
    window.document.body.contains = () => true
    window.addEventListener = vi.fn()
    window.removeEventListener = vi.fn()

    vi.useFakeTimers()

    // Start runIframe but DO NOT await, and DO NOT run timers
    runIframe(url, { eventOrigin: origin, timeout: 999999 })

    const timeoutValue = 12345
    const setTimeoutSpy = vi.spyOn(global, "setTimeout").mockReturnValue(timeoutValue as any)

    iframe.onload!()

    expect(setTimeoutSpy).toHaveBeenCalled()

    // We cannot read `onLoadTimeoutId` directly, but this ensures correct behavior.
    expect(setTimeoutSpy.mock.results[0].value).toBe(timeoutValue)
  })
})
