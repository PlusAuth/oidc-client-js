import { afterEach, describe, expect, it, vi } from "vitest"

import { OIDCClientError } from "../../src"
import { runPopup } from "../../src/utils/popup"

describe("runPopup", () => {
  const _TIMEOUT_ERROR = {
    error: "timeout",
    error_description: "Timeout",
    message: "Timeout",
  }

  const url = "https://authorize.com"

  const setup = (customMessage: any) => {
    const popup = {
      location: { href: url },
      close: vi.fn(),
    }

    window.addEventListener = <any>vi.fn((message, callback) => {
      expect(message).toBe("message")
      callback(customMessage)
    })

    return { popup, url }
  }

  describe("with invalid messages", () => {
    afterEach(() => {
      vi.clearAllTimers()
      vi.useRealTimers()
    })
    ;["", {}, { data: "test" }, { data: { type: "other-type" } }].forEach((m) => {
      it(`ignores invalid messages: ${JSON.stringify(m)}`, async () => {
        const { popup, url } = setup(m)
        /**
         * We need to run the timers after we start `runPopup` to simulate
         * the window event listener, but we also need to use `vi.useFakeTimers`
         * to trigger the timeout. That's why we're using a real `setTimeout`,
         * then using fake timers then rolling back to real timers
         */
        setTimeout(() => {
          vi.runOnlyPendingTimers()
        }, 10)
        vi.useFakeTimers()
        // @ts-expect-error
        await expect(runPopup(url, { popup })).rejects.toThrow(OIDCClientError)
      })
    })
  })

  it("returns authorization response message", async () => {
    const message = {
      data: {
        type: "authorization_response",
        response: { id_token: "id_token" },
      },
    }

    const { popup, url } = setup(message)

    // @ts-expect-error
    await expect(runPopup(url, { popup })).resolves.toMatchObject(message.data)

    expect(popup.location.href).toBe(url)
    expect(popup.close).toHaveBeenCalled()
  })

  it("returns authorization error message", async () => {
    const message = {
      data: {
        type: "authorization_response",
        response: {
          error: "error",
          error_description: "error_description",
        },
      },
    }

    const { popup, url } = setup(message)

    // @ts-expect-error
    await expect(runPopup(url, { popup })).rejects.toThrow(OIDCClientError)

    expect(popup.location.href).toBe(url)
    expect(popup.close).toHaveBeenCalled()
  })

  it("times out after config.timeout", async () => {
    const { popup, url } = setup("")
    const seconds = 10

    /**
     * We need to run the timers after we start `runPopup`, but we also
     * need to use `vi.useFakeTimers` to trigger the timeout.
     * That's why we're using a real `setTimeout`, then using fake timers
     * then rolling back to real timers
     */
    setTimeout(() => {
      vi.advanceTimersByTime(seconds * 1000)
    }, 10)

    vi.useFakeTimers()

    await expect(
      runPopup(url, {
        timeout: seconds,
        // @ts-expect-error
        popup,
      }),
    ).rejects.toThrow(OIDCClientError)

    vi.useRealTimers()
  })
  it("times out after DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS if config is not defined", async () => {
    const { popup, url } = setup("")

    /**
     * We need to run the timers after we start `runPopup`, but we also
     * need to use `vi.useFakeTimers` to trigger the timeout.
     * That's why we're using a real `setTimeout`, then using fake timers
     * then rolling back to real timers
     */
    setTimeout(() => {
      vi.advanceTimersByTime(60 * 1000)
    }, 10)

    vi.useFakeTimers()

    // @ts-expect-error
    await expect(runPopup(url, { popup })).rejects.toThrow(OIDCClientError)

    vi.useRealTimers()
  })

  it("creates and uses a popup window if none was given", async () => {
    const message = {
      data: {
        type: "authorization_response",
        response: { id_token: "id_token" },
      },
    }

    const { popup, url } = setup(message)
    const oldOpenFn = window.open

    window.open = <any>vi.fn(() => popup)

    await expect(runPopup(url, {})).resolves.toMatchObject(message.data)

    expect(popup.location.href).toBe(url)
    expect(popup.close).toHaveBeenCalled()

    window.open = oldOpenFn
  })
})
