import { describe, expect, it, vi } from "vitest"
import { OIDCClient } from "../../src/client"
import { Events } from "../../src/constants"

vi.mock("../../src/utils", async () => {
  const actual = await vi.importActual<typeof import("../../src/utils")>("../../src/utils")

  return {
    ...actual,
    // Don't load real check-session iframe logic
    createSessionCheckerFrame: vi.fn((opts) => ({
      start: vi.fn(),
      stop: vi.fn(),
      __callback: opts.callback, // expose callback so the test can fire it
    })),
    runIframe: vi.fn(),
    generateRandom: () => "random",
    deriveChallenge: () => "challenge",
    validateIdToken: () => ({}),
    buildEncodedQueryString: () => "?a=b",
    parseQueryUrl: () => ({}),
    request: vi.fn(),
  }
})

function makeClient({ storedAuth, silentLoginError }: any = {}) {
  const options = {
    issuer: "https://issuer",
    client_id: "abc",
    endpoints: {
      check_session_iframe: "https://issuer/check",
    },
    checkSession: true,
    autoSilentRenew: false,
  }

  const client = new OIDCClient(options)

  // Mock internal stores
  // @ts-expect-error internal
  client.authStore.get = vi.fn().mockResolvedValue(storedAuth)
  // @ts-expect-error internal
  client.authStore.set = vi.fn()
  // @ts-expect-error internal
  client.authStore.clear = vi.fn()

  // Mock silentLogin
  client.silentLogin = silentLoginError
    ? vi.fn().mockRejectedValue(silentLoginError)
    : vi.fn().mockResolvedValue({})

  // Capture events
  client.emit = vi.fn()

  return client
}

describe("session monitoring", () => {
  it("emits USER_LOGOUT when session checker callback receives an error", async () => {
    const client = makeClient()

    // @ts-expect-error internal
    client.monitorSession({ sub: "u1", session_state: "s1" })

    const frame = (client as any).sessionCheckerFrame
    await frame.__callback(new Error("boom"))

    expect(client.emit).toHaveBeenCalledWith(Events.USER_LOGOUT)
  })

  it("restarts session checking when callback succeeds and storedAuth matches sub", async () => {
    const storedAuth = {
      user: { sub: "u1" },
      session_state: "next-session",
    }

    const client = makeClient({ storedAuth })

    // @ts-expect-error internal
    client.monitorSession({ sub: "u1", session_state: "initial" })

    const frame = (client as any).sessionCheckerFrame
    frame.start.mockClear() // remove initial start("initial")

    await frame.__callback(null)

    expect(frame.start).toHaveBeenCalledWith("next-session")
  })

  it("does not restart session checking when storedAuth user.sub does not match", async () => {
    const storedAuth = {
      user: { sub: "other-user" },
      session_state: "whatever",
    }

    const client = makeClient({ storedAuth })

    // @ts-expect-error internal
    client.monitorSession({ sub: "u1", session_state: "initial" })
    const frame = (client as any).sessionCheckerFrame
    frame.start.mockClear()

    await frame.__callback(null)

    expect(frame.start).not.toHaveBeenCalled()
  })

  it("emits USER_LOGOUT(null) when callback succeeds but no stored auth exists", async () => {
    const client = makeClient({ storedAuth: null })

    // @ts-expect-error internal
    client.monitorSession({ sub: "u1", session_state: "initial" })
    const frame = (client as any).sessionCheckerFrame

    await frame.__callback(null)

    expect(client.emit).toHaveBeenCalledWith(Events.USER_LOGOUT, null)
  })

  it("emits USER_LOGOUT when silentLogin() fails inside callback", async () => {
    const client = makeClient({
      silentLoginError: new Error("fail"),
    })

    // @ts-expect-error internal
    client.monitorSession({ sub: "u1", session_state: "initial" })
    const frame = (client as any).sessionCheckerFrame

    await frame.__callback(null)

    expect(client.emit).toHaveBeenCalledWith(Events.USER_LOGOUT)
  })

  it("provides a stop() method on the sessionCheckerFrame instance", () => {
    const client = makeClient()

    // @ts-expect-error internal
    client.monitorSession({ sub: "u1", session_state: "initial" })

    const frame = (client as any).sessionCheckerFrame
    expect(frame.stop).toBeTypeOf("function")
  })
})
