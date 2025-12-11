import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest"

// --- Module mocks (ESM-safe, partial mocks) ---

vi.mock("../src/utils/jose", async () => {
  const actual = await vi.importActual<typeof import("../src/utils/jose")>("../src/utils/jose")

  return {
    ...actual,
    // used in .createAuthRequest()
    deriveChallenge: vi.fn().mockResolvedValue("code_challenge"),
    // used in .handleTokenResult()
    validateIdToken: vi.fn(),
  }
})

vi.mock("../src/utils/iframe", async () => {
  const actual = await vi.importActual<typeof import("../src/utils/iframe")>("../src/utils/iframe")

  return {
    ...actual,
    runIframe: vi.fn(),
  }
})

vi.mock("../src/utils/popup", async () => {
  const actual = await vi.importActual<typeof import("../src/utils/popup")>("../src/utils/popup")

  return {
    ...actual,
    runPopup: vi.fn(),
  }
})

vi.mock("../src/utils/check_session_iframe", async () => {
  const actual = await vi.importActual<typeof import("../src/utils/check_session_iframe")>(
    "../src/utils/check_session_iframe",
  )

  return {
    ...actual,
    createSessionCheckerFrame: vi.fn(),
  }
})

// --- Imports AFTER mocks ---

import {
  AuthenticationError,
  Events,
  InMemoryStateStore,
  InteractionCancelled,
  InvalidIdTokenError,
  LocalStorageStateStore,
  OIDCClient,
  OIDCClientError,
  StateNotFound,
  StateStore,
} from "../src"
import { Timer } from "../src/helpers/timer"
import * as checkSessionUtils from "../src/utils/check_session_iframe"
import * as iframeUtils from "../src/utils/iframe"
import { deriveChallenge, validateIdToken } from "../src/utils/jose"
import * as popupUtils from "../src/utils/popup"

// --- Global fetch mock ---

const fetchMock = vi.fn().mockResolvedValue({
  json: () => ({}),
})

;(globalThis as any).fetch = fetchMock
const mockedFetch = fetchMock as Mock

// --- Shared dummy options ---

const dummyOpts = {
  issuer: "https://test.plusauth.com/",
  client_id: "test",
  endpoints: {
    authorization_endpoint: "dummy_auth",
    token_endpoint: "dummy_token",
    end_session_endpoint: "dummy_end_session",
  },
}

describe("oidc client", () => {
  afterEach(() => {
    mockedFetch.mockClear()
  })

  describe("[constructor]", () => {
    it("should accept valid issuer", () => {
      const validIssuers = [
        "http://openid.net/specs/connect/1.0/issuer",
        "http://localhost:45543/specs/connect/1.0/issuer",
        "http://example.co:8000",
        "http://localhost:45543",
        "https://example.org",
        "https://a.b.example.com",
        "https://example.co",
        "https://example.io",
        "https://example.co:8000",
        "https://test.plusauth.com",
      ]

      for (const issuer of validIssuers) {
        expect(() => new OIDCClient({ issuer, client_id: "" })).not.toThrow()
      }
    })

    it("should fail with invalid issuers", () => {
      const invalidIssuers = [
        "ftp://something",
        "something.co",
        "something.co?test=search",
        "something.co#hashquery",
        "something.co:9999",
        "something.co:9999?test=search",
        "something.co:9999#hashquery",
        "http://www.example.com?test=search",
        "http://www.example.com#hashquery",
      ]

      for (const issuer of invalidIssuers) {
        try {
          new OIDCClient({ issuer, client_id: "" })
          throw new Error(`Should fail with issuer: ${issuer}`)
        } catch (e: any) {
          expect(e).toBeInstanceOf(OIDCClientError)
          expect(e.message).toBe('"issuer" must be a valid uri.')
        }
      }
    })

    it("should remove last slash from issuer uri", () => {
      const oidc = new OIDCClient(dummyOpts)

      expect(oidc.options.issuer).toBe("https://test.plusauth.com")
    })

    it("should be an event source", () => {
      const oidc = new OIDCClient(dummyOpts)
      expect(oidc).toHaveProperty("emit")
      expect(oidc).toHaveProperty("on")
      expect(oidc).toHaveProperty("once")
      expect(oidc).toHaveProperty("off")
    })

    it("should apply defaults", () => {
      const oidc = new OIDCClient(dummyOpts)

      expect(oidc.options.stateLength).toBe(10)
      expect(oidc.options.nonceLength).toBe(10)
      expect(oidc.options.secondsToRefreshAccessTokenBeforeExp).toBe(60)
      expect(oidc.options.autoSilentRenew).toBe(true)
      expect(oidc.options.checkSession).toBe(true)
      // @ts-expect-error internal properties
      expect(oidc.authStore).toBeInstanceOf(InMemoryStateStore)
      // @ts-expect-error internal properties
      expect(oidc.stateStore).toBeInstanceOf(LocalStorageStateStore)
    })

    it("should create access token timer if `autoSilentRenew` enabled", () => {
      const oidc = new OIDCClient({ ...dummyOpts, autoSilentRenew: true })
      // @ts-expect-error internal properties
      expect(oidc._accessTokenExpireTimer).toBeInstanceOf(Timer)
    })

    it("should allow custom state stores", () => {
      class CustomStateStore extends StateStore {
        get = vi.fn()
        set = vi.fn()
        clear = vi.fn()
        del = vi.fn()
      }
      const oidcClient = new OIDCClient({
        issuer: "https://testoidcuri.com",
        client_id: "test",
        stateStore: new CustomStateStore(),
      })
      expect(oidcClient.options.stateStore).toBeInstanceOf(CustomStateStore)
    })

    it("should allow custom auth stores", () => {
      class CustomStateStore extends StateStore {
        get = vi.fn()
        set = vi.fn()
        clear = vi.fn()
        del = vi.fn()
      }
      const oidcClient = new OIDCClient({
        issuer: "https://testoidcuri.com",
        client_id: "test",
        authStore: new CustomStateStore(),
      })
      expect(oidcClient.options.authStore).toBeInstanceOf(CustomStateStore)
    })

    it("should set/clear direct variables on login/logout", async () => {
      const oidc = new OIDCClient(dummyOpts)
      const authObj = {
        expires_in: "e",
        user: "u",
        scope: "s",
        access_token: "at",
        id_token: "it",
        refresh_token: "rt",
      }
      // @ts-expect-error internal
      oidc.onUserLogin(authObj)
      await new Promise<void>((resolve) =>
        setTimeout(() => {
          console.log("2")
          expect(oidc.user).toBeTruthy()
          expect(oidc.accessToken).toBeTruthy()
          expect(oidc.idToken).toBeTruthy()
          expect(oidc.scopes).toBeTruthy()
          expect(oidc.refreshToken).toBeTruthy()
          resolve()
        }),
      )
      oidc.emit("user_logout")

      await new Promise<void>((resolve) =>
        setTimeout(() => {
          expect(oidc.user).toBeFalsy()
          expect(oidc.accessToken).toBeFalsy()
          expect(oidc.idToken).toBeFalsy()
          expect(oidc.scopes).toBeFalsy()
          expect(oidc.refreshToken).toBeFalsy()
          resolve()
        }),
      )
    })

    it('should start accessTokenRefresh timer when "autoSilentRenew" = true', async () => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        autoSilentRenew: true,
        secondsToRefreshAccessTokenBeforeExp: 120,
      })
      // @ts-expect-error internal
      const origFn = oidc.synchronizer.CallOnce
      // @ts-expect-error internal
      oidc.synchronizer.CallOnce = vi.fn((_ss: any, fn: () => void) => fn())

      oidc.silentLogin = vi.fn(async () => Promise.resolve())
      // @ts-expect-error override internal timer
      oidc._accessTokenExpireTimer = {
        start: vi.fn((_exp: number, cb: () => void) => {
          cb()
        }),
      }

      // @ts-expect-error internal
      oidc.onUserLogin({ access_token: "dummyToken", expires_in: 120, user: {} })

      setTimeout(() => {
        // everything is synchronous now
        // @ts-expect-error internal
        expect(oidc._accessTokenExpireTimer.start).toHaveBeenCalled()
        // @ts-expect-error internal
        expect(oidc.synchronizer.CallOnce).toHaveBeenCalled()
        expect(oidc.silentLogin).toHaveBeenCalled()

        // restore original
        // @ts-expect-error internal
        oidc.synchronizer.CallOnce = origFn
      })
    })

    it('should emit silent_renew error when "autoSilentRenew" = true', async () => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        autoSilentRenew: true,
        secondsToRefreshAccessTokenBeforeExp: 120,
      })
      // @ts-expect-error internal
      const origFn = oidc.synchronizer.CallOnce
      // @ts-expect-error internal
      oidc.synchronizer.CallOnce = vi.fn((_ss: any, fn: () => void) => fn())

      oidc.silentLogin = vi.fn(async () => Promise.reject("my custom error"))
      // @ts-expect-error override internal timer
      oidc._accessTokenExpireTimer = {
        start: vi.fn((_exp: number, cb: () => void) => {
          cb()
        }),
      }

      // @ts-expect-error internal
      oidc.onUserLogin({ access_token: "dummyToken", expires_in: 120, user: {} })

      setTimeout(() => {
        // everything is synchronous now
        // @ts-expect-error internal
        expect(oidc._accessTokenExpireTimer.start).toHaveBeenCalled()
        // @ts-expect-error internal
        expect(oidc.synchronizer.CallOnce).toHaveBeenCalled()
        expect(oidc.silentLogin).rejects.toThrow("my custom error")

        // restore original
        // @ts-expect-error internal
        oidc.synchronizer.CallOnce = origFn
      })
    })
  })

  describe("[getters]", () => {
    it("should work", async () => {
      const getters = [
        "getAccessToken",
        "getRefreshToken",
        "getIdToken",
        "getIdTokenRaw",
        "getScopes",
        "getExpiresIn",
        "getUser",
      ]
      const oidc = new OIDCClient(dummyOpts) as any
      const storeEntry = {
        authParams: {
          client_id: "test",
          state: "TyqL9Uztfx",
          scope: "scope scope1",
          redirect_uri: "https://test",
          response_mode: "fragment",
          response_type: "id_token token",
          nonce: "zw5kXFU6C0",
        },
        user: {
          sub: "123123",
          name: null,
          username: null,
          updated_at: 1693991194,
          email: "john@doe.com",
          email_verified: true,
          s_hash: "gnH0mJ8qkfFp6nwoxo5GmA",
        },
        id_token: {
          sub: "123123",
          name: null,
          username: null,
          updated_at: 1693991194,
          email: "john@doe.com",
          email_verified: true,
          nonce: "zw5kXFU6C0",
          at_hash: "10GcVFUGFN-0hBy17UJBKQ",
          s_hash: "gnH0mJ8qkfFp6nwoxo5GmA",
          exp: 1693994893,
          iat: 1693991293,
          iss: "https://test.issuer.com",
        },
        access_token: "acc_token",
        expires_in: "7200",
        token_type: "Bearer",
        scope: "scope scope1",
        state: "TyqL9Uztfx",
        session_state: "uWqBtGfPDBMQH14R5RNx1Vv49dA-abJ4XqXdzKeAaDs",
        id_token_raw: "test",
        refresh_token: "test",
      }
      oidc.authStore.get = vi.fn(() => Promise.resolve(storeEntry))

      for (const getter of getters) {
        expect(oidc).toHaveProperty(getter)
        // eslint-disable-next-line no-await-in-loop
        expect(await oidc[getter]()).toBeTruthy()
      }
      expect(oidc.authStore.get).toHaveBeenCalledTimes(getters.length)
    })
  })

  describe(".initialize()", () => {
    it("should return initialized instance if it is already initialized", async () => {
      const oidc = new OIDCClient({ issuer: "http://test.com", client_id: "test" })
      // @ts-expect-error internal
      expect(oidc.initialized).toBeFalsy()
      // @ts-expect-error internal
      oidc.fetchFromIssuer = vi.fn(async () => ({}))

      const client = await oidc.initialize(false)
      // @ts-expect-error internal
      expect(oidc.initialized).toBe(true)
      expect(client).toBe(oidc)

      const newClient = await oidc.initialize(false)
      expect(newClient).toBe(oidc)
      // @ts-expect-error internal
      expect(oidc.fetchFromIssuer).toHaveBeenCalledTimes(1)
    })

    it("should return initializing promise instance if it is initializing", async () => {
      const oidc = new OIDCClient({ issuer: "http://test.com", client_id: "test" })
      // @ts-expect-error internal
      expect(oidc.initialized).toBeFalsy()
      // @ts-expect-error internal
      oidc.fetchFromIssuer = vi.fn(async () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 1000)
        })
      })

      oidc.initialize(false)
      const client = await oidc.initialize(false)
      // @ts-expect-error internal
      expect(oidc.initialized).toBe(true)
      expect(client).toBe(oidc)
    })

    it("should fetch issuer metadata when endpoints not provided", async () => {
      const oidc = new OIDCClient({ issuer: "http://test.com", client_id: "test" })
      // @ts-expect-error internal
      oidc.fetchFromIssuer = vi.fn(async () => ({}))

      await oidc.initialize(false)
      // @ts-expect-error internal
      expect(oidc.fetchFromIssuer).toHaveBeenCalled()
    })

    it("should fail when metadata loading fails", async () => {
      const oidc = new OIDCClient({ issuer: "http://test.com", client_id: "test" })
      // @ts-expect-error internal
      expect(oidc.initialized).toBeFalsy()
      // @ts-expect-error internal
      oidc.fetchFromIssuer = vi.fn(async () => {
        throw new OIDCClientError("failed")
      })

      await expect(oidc.initialize(false)).rejects.toMatchObject({
        error: "failed",
      })
    })

    it("should fail with generic error", async () => {
      const oidc = new OIDCClient({ issuer: "http://test.com", client_id: "test" })
      // @ts-expect-error internal
      expect(oidc.initialized).toBeFalsy()
      // @ts-expect-error internal
      oidc.fetchFromIssuer = vi.fn(async () => {
        throw new Error("fails")
      })

      await expect(oidc.initialize(false)).rejects.toMatchObject({
        error: "fails",
      })
    })

    it("should initialize stores", async () => {
      class MockStore {
        init = vi.fn()
        get = vi.fn()
      }

      const mockStore = new MockStore() as any

      const oidc = new OIDCClient({
        ...dummyOpts,
        stateStore: mockStore,
        authStore: mockStore,
      })

      await oidc.initialize(false)

      expect(mockStore.init).toHaveBeenCalledTimes(2)
    })

    it("should silentLogin if `checkLogin` true", async () => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.silentLogin = vi.fn(async () => Promise.resolve())

      await oidc.initialize()

      expect(oidc.silentLogin).toHaveBeenCalled()
    })

    it("should clear authStore if login check fails", async () => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.authStore.clear = vi.fn()
      oidc.silentLogin = vi.fn(async () => Promise.reject(new Error("fail")))

      await oidc.initialize()

      expect(oidc.silentLogin).toHaveBeenCalled()
      // @ts-expect-error
      expect(oidc.authStore.clear).toHaveBeenCalled()
    })
  })

  describe(".isLoggedIn()", () => {
    it("should return local user if it exists", async () => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.getUser = vi.fn(() => Promise.resolve({ user: "x" } as any))

      const value = await oidc.isLoggedIn()

      expect(oidc.getUser).toHaveBeenCalled()
      expect(value).toBe(true)
    })

    it("should silent login if local user does not exist", async () => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.getUser = vi.fn(() => Promise.resolve(null as any))
      oidc.silentLogin = vi.fn(() => Promise.resolve({ user: "x" } as any))

      const value = await oidc.isLoggedIn()

      expect(oidc.silentLogin).toHaveBeenCalled()
      expect(value).toBe(true)
    })

    it("should return false when silent login fails", async () => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.getUser = vi.fn(() => Promise.resolve(null as any))
      oidc.silentLogin = vi.fn(() => Promise.reject(new Error("fail")))

      const value = await oidc.isLoggedIn()

      expect(oidc.silentLogin).toHaveBeenCalled()
      expect(value).toBe(false)
    })
  })

  describe(".createAuthRequest()", () => {
    it("should try to fetch authorization endpoint uri", async () => {
      const oidc = new OIDCClient({ ...dummyOpts, endpoints: {} as any })
      // @ts-expect-error internal
      oidc.fetchFromIssuer = vi.fn(() => {
        oidc.options.endpoints = dummyOpts.endpoints
      })

      // @ts-expect-error
      await oidc.createAuthRequest()

      // @ts-expect-error
      expect(oidc.fetchFromIssuer).toHaveBeenCalledTimes(1)
    })

    it("should build uri", async () => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      const uri = await oidc.createAuthRequest()
      expect(typeof uri).toBe("string")
    })

    it("should store to state store", async () => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.stateStore.set = vi.fn()

      // @ts-expect-error
      await oidc.createAuthRequest()

      // @ts-expect-error
      expect(oidc.stateStore.set).toHaveBeenCalled()
    })

    it('should generate nonce if response type includes "id_token"', async () => {
      const oidc = new OIDCClient({ ...dummyOpts, response_type: "id_token" })

      // @ts-expect-error
      const uri = await oidc.createAuthRequest()
      expect(uri).toMatch(/&nonce=\w+&?/)
    })

    it("should use provided state length", async () => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        stateLength: 16,
        response_type: "id_token",
      })

      // @ts-expect-error
      const uri = await oidc.createAuthRequest()
      expect(uri).toMatch(/&state=\w+&?/)
      expect(uri.match(/&state=(\w+)&?/)![1].length).toBe(16)
    })

    it("should use provided nonce length", async () => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        nonceLength: 16,
        response_type: "id_token",
      })

      // @ts-expect-error
      const uri = await oidc.createAuthRequest()
      expect(uri).toMatch(/&nonce=\w+&?/)
      expect(uri.match(/&nonce=(\w+)&?/)![1].length).toBe(16)
    })

    it('should generate nonce if scope includes "openid"', async () => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        response_type: "code",
        scope: "openid profile",
      })
      // @ts-expect-error
      const uri = await oidc.createAuthRequest()
      expect(uri).toMatch(/&nonce=\w+&?/)
    })

    it("should include passed options in request", async () => {
      const authParams: Record<string, string> = {
        acr_values: "test",
        state: "state",
        nonce: "nonce",
        audience: "test",
        claims_locales: "test",
        client_id: "test",
        code_challenge_method: "test",
        display: "test",
        prompt: "test",
        redirect_uri: "test",
        registration: "test",
        response_mode: "test",
        response_type: "code",
        scope: "test",
        ui_locales: "test",
        web_message_target: "test",
        web_message_uri: "test",
      }

      const oidc = new OIDCClient({
        ...dummyOpts,
        ...authParams,
      })
      // @ts-expect-error
      const uri = await oidc.createAuthRequest()

      for (const param of Object.keys(authParams)) {
        expect(uri).toMatch(new RegExp(`\\&?${param}=${authParams[param]}\\&?`))
      }
    })

    it("should include extra params in auth query", async () => {
      const extraParams: Record<string, any> = {
        test: 1,
        test2: 2,
      }

      const oidc = new OIDCClient({
        ...dummyOpts,
        extraParams,
      })
      // @ts-expect-error
      const uri = await oidc.createAuthRequest()
      for (const param of Object.keys(extraParams)) {
        expect(uri).toMatch(new RegExp(`\\&?${param}=${extraParams[param]}\\&?`))
      }
    })

    it('should generate code_challenge if response type includes "code"', async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.stateStore.set = vi.fn()

      // @ts-expect-error
      const uri = await oidc.createAuthRequest()

      expect(uri).toMatch(/&code_challenge=code_challenge&/)
      expect(uri).toMatch(/&code_challenge_method=S256&?/)
      expect(deriveChallenge).toHaveBeenCalled()
    })
  })

  describe(".createLogoutRequest()", () => {
    it("should build uri", async () => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      const uri = await oidc.createLogoutRequest()
      expect(typeof uri).toBe("string")
    })
  })

  describe(".exchangeAuthorizationCode()", () => {
    it("should fail without `code`", async () => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      await expect(oidc.exchangeAuthorizationCode({})).rejects.toThrow('"code" is required')
    })

    it("should fail without `redirect_uri`", async () => {
      const oidc = new OIDCClient(dummyOpts)
      await expect(
        // @ts-expect-error
        oidc.exchangeAuthorizationCode({ code: "test" }),
      ).rejects.toThrow('"redirect_uri" is required')
    })

    it("should fail without `code_verifier`", async () => {
      const oidc = new OIDCClient(dummyOpts)
      await expect(
        // @ts-expect-error
        oidc.exchangeAuthorizationCode({ code: "test", redirect_uri: "test" }),
      ).rejects.toThrow('"code_verifier" is required')
    })

    it("should fail without `client_id`", async () => {
      // @ts-expect-error
      const oidc = new OIDCClient({ issuer: "http://test.com/" })
      await expect(
        // @ts-expect-error
        oidc.exchangeAuthorizationCode({
          code: "test",
          redirect_uri: "test",
          code_verifier: "test",
        }),
      ).rejects.toThrow('"client_id" is required')
    })

    it("should exchange code", async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      await oidc.exchangeAuthorizationCode({
        code: "test",
        redirect_uri: "test",
        code_verifier: "test",
      })

      expect(mockedFetch).toHaveBeenCalledTimes(1)
    })

    it("should use client_secret", async () => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        client_secret: "test_secret",
        redirect_uri: "http://localhost:8080",
      })

      // @ts-expect-error
      await oidc.handleAuthResponse({ code: "test" }, {}, { code_verifier: "test" })

      expect(mockedFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe(".exchangeRefreshToken()", () => {
    it("should fail without `refresh_token`", async () => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      await expect(oidc.exchangeRefreshToken({})).rejects.toThrow('"refresh_token" is required')
    })

    it("should fail without `client_id`", async () => {
      // @ts-expect-error
      const oidc = new OIDCClient({ issuer: "http://test.com/" })
      await expect(
        // @ts-expect-error
        oidc.exchangeRefreshToken({ refresh_token: "test" }),
      ).rejects.toThrow('"client_id" is required')
    })

    it("should exchange refresh token", async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      await oidc.exchangeRefreshToken({ refresh_token: "test" })

      expect(mockedFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe(".fetchFromIssuer()", () => {
    it("should fetch", async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      await oidc.fetchFromIssuer()

      expect(mockedFetch).toHaveBeenCalledTimes(1)
    })

    it("should fail with generic error", async () => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.http = vi.fn(async () => {
        throw new Error("fails")
      })

      // @ts-expect-error
      await expect(oidc.fetchFromIssuer()).rejects.toMatchObject({
        error: "Loading metadata failed",
        error_description: "fails",
      })
    })
  })

  describe(".fetchUserInfo()", () => {
    it("should fetch", async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      await oidc.fetchUserInfo("token")

      expect(mockedFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe(".revokeToken()", () => {
    it("should revoke", async () => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        endpoints: {
          revocation_endpoint: "dummy_revoke",
        },
      })
      await oidc.revokeToken("token")

      expect(mockedFetch).toHaveBeenCalledTimes(1)
    })

    it('should fail without "revocation_endpoint"', async () => {
      const oidc = new OIDCClient(dummyOpts)
      await expect(oidc.revokeToken("token")).rejects.toMatchObject({
        message: '"revocation_endpoint" doesn\'t exist',
      })
    })
  })

  describe(".loadState()", () => {
    it("should retrieve stored state", async () => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      const mockedGet = (oidc.stateStore.get = vi.fn(async (state) => state === "exist"))
      // @ts-expect-error
      const mockedDel = (oidc.stateStore.del = vi.fn(async (state) => state === "exist"))

      // @ts-expect-error
      await oidc.loadState("exist")

      expect(mockedGet).toHaveBeenCalled()
      expect(mockedDel).toHaveBeenCalled()
    })

    it("should fail if state does not exist", async () => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      const mockedGet = (oidc.stateStore.get = vi.fn(async (state) => state === "exist"))

      await expect(
        // @ts-expect-error
        oidc.loadState("notExists"),
      ).rejects.toBeInstanceOf(StateNotFound)

      expect(mockedGet).toHaveBeenCalled()
    })
  })

  describe(".handleAuthResponse()", () => {
    it("should handle", async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      const resp = await oidc.handleAuthResponse({ param: "value" }, {}, {})

      expect(resp).toStrictEqual({ param: "value" })
    })

    it("should exchange code", async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.exchangeAuthorizationCode = vi.fn(async () => ({}))

      // @ts-expect-error
      await oidc.handleAuthResponse({ code: "code" }, {}, {})

      // @ts-expect-error
      expect(oidc.exchangeAuthorizationCode).toHaveBeenCalled()
    })
  })

  describe(".handleTokenResult()", () => {
    let mockedValidator: Mock

    beforeAll(() => {
      mockedValidator = validateIdToken as Mock
      mockedValidator.mockResolvedValue({
        nonce: "nonUserClaim",
        first_name: "first",
      })
    })

    afterEach(() => mockedValidator.mockClear())
    afterAll(() => mockedValidator.mockReset())

    it("should handle", async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      const resp = await oidc.handleTokenResult({}, {}, {})

      expect(resp).toEqual({ authParams: {}, scope: undefined, user: {} })
    })

    it('should handle "id_token"', async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      const resp = await oidc.handleTokenResult({ id_token: "test" }, {}, {})

      expect(mockedValidator).toHaveBeenCalled()
      expect(resp).toEqual({
        authParams: {},
        id_token_raw: "test",
        id_token: {
          first_name: "first",
          nonce: "nonUserClaim",
        },
        scope: undefined,
        user: {
          first_name: "first",
        },
      })
    })

    it('should call custom "idTokenValidator"', async () => {
      const customValidator = vi.fn(async () => false)
      const oidc = new OIDCClient(dummyOpts)

      await expect(
        // @ts-expect-error
        oidc.handleTokenResult(
          { id_token: "test" },
          {},
          // @ts-expect-error
          { idTokenValidator: customValidator },
        ),
      ).rejects.toBeInstanceOf(InvalidIdTokenError)

      expect(mockedValidator).toHaveBeenCalled()
      expect(customValidator).toHaveBeenCalled()
    })

    it('should handle "access_token"', async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      const resp = await oidc.handleTokenResult({ access_token: "test" }, {}, {})

      expect(resp).toEqual({
        authParams: {},
        access_token: "test",
        scope: undefined,
        user: {},
      })
    })

    it('should fetch user info when "requestUserInfo" = true', async () => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        endpoints: {
          userinfo_endpoint: "user_info_endpoint",
        },
      })
      // @ts-expect-error
      oidc.fetchUserInfo = vi.fn().mockResolvedValue({ sub: "test" })

      // @ts-expect-error
      const resp = await oidc.handleTokenResult(
        { access_token: "dummyToken" },
        {},
        // @ts-expect-error
        {
          requestUserInfo: true,
        },
      )

      // @ts-expect-error
      expect(oidc.fetchUserInfo).toHaveBeenCalledWith("dummyToken")
      expect(resp).toEqual({
        authParams: {},
        access_token: "dummyToken",
        scope: undefined,
        user: { sub: "test" },
      })
    })

    it("should fail on error response", async () => {
      const oidc = new OIDCClient(dummyOpts)

      await expect(
        // @ts-expect-error
        oidc.handleTokenResult(
          { error: "error", error_description: "invalid_client" },
          {},
          // @ts-expect-error
          {},
        ),
      ).rejects.toMatchObject({
        error: "error",
        error_description: "invalid_client",
      })
    })
  })

  describe(".login()", () => {
    beforeAll(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        configurable: true,
        value: {
          ...window.location,
          assign: vi.fn(),
        },
      })
    })

    it("should navigate the window to auth request", async () => {
      const oidc = new OIDCClient(dummyOpts)
      await oidc.login()

      expect(window.location.assign).toHaveBeenCalled()
    })
  })

  describe(".loginWithPopup()", () => {
    it("should execute popup and handle auth result", async () => {
      const mockedRunPopup = popupUtils.runPopup as Mock
      mockedRunPopup.mockResolvedValue({
        response: { state: "test" },
        state: { authParams: {}, localState: {} },
      })

      const oidc = new OIDCClient(dummyOpts)
      const authResult = { user: "x" }

      // @ts-expect-error
      oidc.exchangeAuthorizationCode = vi.fn(async () => ({}))
      // @ts-expect-error
      oidc.handleTokenResult = vi.fn(async () => authResult)

      const onLogin = vi.fn()
      oidc.on(Events.USER_LOGIN, onLogin)

      await oidc.loginWithPopup()

      expect(mockedRunPopup).toHaveBeenCalled()
      expect(onLogin).toHaveBeenCalledWith(authResult)
    })

    it("should throw interaction error when user closes popup", async () => {
      const mockedRunPopup = popupUtils.runPopup as Mock
      mockedRunPopup.mockImplementation(async () => {
        throw new InteractionCancelled("user closed")
      })

      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.exchangeAuthorizationCode = vi.fn(async () => ({}))
      // @ts-expect-error
      oidc.handleTokenResult = vi.fn()

      await expect(oidc.loginWithPopup()).rejects.toBeInstanceOf(InteractionCancelled)
    })
  })

  describe(".monitorSession()", () => {
    const mockedChecker = checkSessionUtils.createSessionCheckerFrame as Mock
    const mockedStart = vi.fn()
    const mockedStop = vi.fn()

    beforeEach(() => {
      mockedChecker.mockReset()
      mockedChecker.mockReturnValue({
        start: mockedStart,
        stop: mockedStop,
      })
      mockedStart.mockClear()
      mockedStop.mockClear()
    })

    it('should not run if "check_session_iframe" not exists', () => {
      const oidc = new OIDCClient(dummyOpts)
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      // @ts-expect-error
      oidc.monitorSession({})

      expect(warnSpy).toHaveBeenCalledWith(
        '"check_session_iframe" endpoint missing or session management is not supported by provider',
      )

      warnSpy.mockRestore()
    })

    it("should should create session checker if not exists", () => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        endpoints: {
          check_session_iframe: "http://example.com/example",
        },
      })

      const session_state = "state"
      // @ts-expect-error
      oidc.monitorSession({ sub: "s", session_state })

      expect(mockedChecker).toHaveBeenCalled()
      expect(mockedStart).toHaveBeenCalledWith(session_state)
    })
  })

  describe(".loginCallback()", () => {
    it("should fail if no url is passed", async () => {
      const oidc = new OIDCClient(dummyOpts)
      const oldWindowLocation = window.location

      // force window.location to be undefined to simulate missing url param usage
      delete (window as any).location

      await expect(oidc.loginCallback()).rejects.toMatchObject({
        message: "Url must be passed to handle login redirect",
      })

      window.location = oldWindowLocation as any
    })

    it("should fail if wrong url is passed", async () => {
      const oidc = new OIDCClient(dummyOpts)

      await expect(oidc.loginCallback("wrongUrlformat#asdasdasd")).rejects.toMatchObject({
        message: 'Invalid callback url passed: "wrongUrlformat#asdasdasd"',
      })
    })

    it("should exchange auth code", async () => {
      const authObj = { user: { sub: "test" } }

      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.loadState = vi.fn(async () => ({
        authParams: {},
        localState: {},
        request_type: "d",
      }))
      // @ts-expect-error
      oidc.exchangeAuthorizationCode = vi.fn()
      // @ts-expect-error
      oidc.handleTokenResult = vi.fn(async () => authObj)

      const onLogin = vi.fn()
      oidc.on(Events.USER_LOGIN, onLogin)

      await oidc.loginCallback("http://example.com?code=1q2w3e4r&state=123456")

      // @ts-expect-error
      expect(oidc.loadState).toHaveBeenCalledWith("123456")
      expect(onLogin).toHaveBeenCalledWith(authObj)
    })

    it("should fail if auth request failed", async () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.loadState = vi.fn(async () => ({
        authParams: {},
        localState: {},
        request_type: "d",
      }))

      await expect(
        oidc.loginCallback(
          "http://example.com?error=auth_error&error_description=failed&state=123456",
        ),
      ).rejects.toBeInstanceOf(AuthenticationError)

      // @ts-expect-error
      expect(oidc.loadState).toHaveBeenCalledWith("123456")
    })

    it("should notify parent if it is called from embedded document", async () => {
      Object.defineProperty(window, "frameElement", {
        configurable: true,
        value: "123",
      })

      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.loadState = vi.fn(async () => ({
        authParams: {},
        localState: {},
        request_type: "s",
      }))

      window.parent.postMessage = vi.fn()

      await oidc.loginCallback("http://example.com?code=1q2w3e4r&state=123456")

      // @ts-expect-error
      expect(oidc.loadState).toHaveBeenCalledWith("123456")
      expect(window.parent.postMessage).toHaveBeenCalledWith(
        {
          type: "authorization_response",
          response: { code: "1q2w3e4r", state: "123456" },
          state: { authParams: {}, localState: {}, request_type: "s" },
        },
        `${window.location.protocol}//${window.location.host}`,
      )
    })

    it("should notify parent if it is called from popup", async () => {
      Object.defineProperty(window, "opener", {
        configurable: true,
        value: {},
      })

      const oidc = new OIDCClient(dummyOpts)

      const state = { authParams: {}, localState: {}, request_type: "p" }
      // @ts-expect-error
      oidc.loadState = vi.fn(async () => state)

      window.opener.postMessage = vi.fn()

      await oidc.loginCallback("http://example.com?code=1q2w3e4r&state=123456")

      // @ts-expect-error
      expect(oidc.loadState).toHaveBeenCalledWith("123456")
      expect(window.opener!.postMessage).toHaveBeenCalledWith(
        {
          type: "authorization_response",
          response: { code: "1q2w3e4r", state: "123456" },
          state,
        },
        `${window.location.protocol}//${window.location.host}`,
      )
    })
  })

  describe(".silentLogin()", () => {
    it("should use refresh_token if there is one", async () => {
      const oidc = new OIDCClient({ ...dummyOpts, useRefreshToken: true })

      const authObj = { user: { sub: "test" } }
      // @ts-expect-error
      oidc.exchangeRefreshToken = vi.fn()
      // @ts-expect-error
      oidc.handleTokenResult = vi.fn(async () => authObj)
      // @ts-expect-error
      await oidc.authStore.set("auth", { refresh_token: "dummyToken" })

      const onLogin = vi.fn()
      oidc.on(Events.USER_LOGIN, onLogin)

      await oidc.silentLogin()

      // @ts-expect-error
      expect(oidc.exchangeRefreshToken).toHaveBeenCalled()
      // @ts-expect-error
      expect(oidc.handleTokenResult).toHaveBeenCalled()
      expect(onLogin).toHaveBeenCalledWith(authObj)
    })

    it("should use silent_redirect_uri as redirect_uri if passed", async () => {
      const mockedRunIframe = iframeUtils.runIframe as Mock
      mockedRunIframe.mockResolvedValue({
        response: { state: "test" },
        state: {},
      })

      const oidc = new OIDCClient({
        ...dummyOpts,
        silent_redirect_uri: "silent_redirect_uri",
        redirect_uri: "redirect_uri",
      })

      const authObj = { user: { sub: "test" } }
      // @ts-expect-error
      oidc.createAuthRequest = vi.fn((opts) => {
        expect(opts!.redirect_uri).toBe("silent_redirect_uri")
        return ""
      })
      // @ts-expect-error
      oidc.exchangeAuthorizationCode = vi.fn()
      // @ts-expect-error
      oidc.handleTokenResult = vi.fn(async () => authObj)

      // @ts-expect-error
      await oidc.authStore.set("auth", {})

      const onLogin = vi.fn()
      oidc.on(Events.USER_LOGIN, onLogin)

      await oidc.silentLogin()

      // @ts-expect-error
      expect(oidc.createAuthRequest).toHaveBeenCalled()
      // @ts-expect-error
      expect(oidc.handleTokenResult).toHaveBeenCalled()
      expect(onLogin).toHaveBeenCalledWith(authObj)
    })

    it("should make auth request if refresh tokens are not used", async () => {
      const mockedRunIframe = iframeUtils.runIframe as Mock
      mockedRunIframe.mockResolvedValue({
        response: { state: "test" },
        state: {},
      })

      const oidc = new OIDCClient(dummyOpts)

      const authObj = { user: { sub: "test" } }
      // @ts-expect-error
      oidc.createAuthRequest = vi.fn()
      // @ts-expect-error
      oidc.handleAuthResponse = vi.fn()
      // @ts-expect-error
      oidc.exchangeAuthorizationCode = vi.fn()
      // @ts-expect-error
      oidc.handleTokenResult = vi.fn(async () => authObj)
      // @ts-expect-error
      await oidc.authStore.set("auth", {})

      const onLogin = vi.fn()
      oidc.on(Events.USER_LOGIN, onLogin)

      await oidc.silentLogin()

      // @ts-expect-error
      expect(oidc.handleAuthResponse).toHaveBeenCalled()
      // @ts-expect-error
      expect(oidc.handleTokenResult).toHaveBeenCalled()
      expect(onLogin).toHaveBeenCalledWith(authObj)
    })
  })

  describe(".logout()", () => {
    const oldLocation = window.location

    beforeEach(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        configurable: true,
        value: {
          ...oldLocation,
          assign: vi.fn(),
        },
      })
    })

    afterEach(() => {
      window.location = oldLocation as any
    })

    it("should redirect window to logout uri", async () => {
      const oidc = new OIDCClient(dummyOpts)
      await oidc.logout()

      expect(window.location.assign).toHaveBeenCalled()
    })

    it('should clear only from local if "localOnly" = true', async () => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      const clearSpy = vi.spyOn(oidc.authStore, "clear")

      await oidc.logout({ localOnly: true })

      expect(clearSpy).toHaveBeenCalled()
      expect(window.location.assign).not.toHaveBeenCalled()
    })
  })
})
