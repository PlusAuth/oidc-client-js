import * as checkSessionUtils from "../src/utils/check_session_iframe"
import * as iframeUtils from "../src/utils/iframe"
import * as joseUtils from "../src/utils/jose"
import * as popupUtils from "../src/utils/popup"

window.fetch = jest.fn().mockReturnValue(
  new Promise((resolve) => {
    resolve({
      json: () => ({}),
    })
  }),
)

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
import { deriveChallenge } from "../src/utils/jose"

const mockedFetch = <jest.Mock>fetch

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
    it("should accept valid issuer", (done) => {
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

      validIssuers.forEach((issuer) => {
        try {
          new OIDCClient({ issuer, client_id: "" })
        } catch (e) {
          done(`${e} : ${issuer}`)
        }
      })
      done()
    })

    it("should fail with invalid issuers", (done) => {
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
      invalidIssuers.forEach((issuer) => {
        try {
          new OIDCClient({ issuer, client_id: "" })
          done(`should fail with: ${issuer}`)
        } catch (e) {
          expect(e).toBeInstanceOf(OIDCClientError)
          expect(e.message).toBe('"issuer" must be a valid uri.')
        }
      })
      done()
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
      // @ts-expect-error
      expect(oidc.authStore).toBeInstanceOf(InMemoryStateStore)
      // @ts-expect-error
      expect(oidc.stateStore).toBeInstanceOf(LocalStorageStateStore)
    })

    it("should create access token timer if `autoSilentRenew` enabled", () => {
      const oidc = new OIDCClient({ ...dummyOpts, autoSilentRenew: true })
      // @ts-expect-error
      expect(oidc._accessTokenExpireTimer).toBeInstanceOf(Timer)
    })

    it("should allow custom state stores", () => {
      class CustomStateStore extends StateStore {
        get = jest.fn()
        set = jest.fn()
        clear = jest.fn()
        del = jest.fn()
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
        get = jest.fn()
        set = jest.fn()
        clear = jest.fn()
        del = jest.fn()
      }
      const oidcClient = new OIDCClient({
        issuer: "https://testoidcuri.com",
        client_id: "test",
        authStore: new CustomStateStore(),
      })
      expect(oidcClient.options.authStore).toBeInstanceOf(CustomStateStore)
    })

    it("should set/clear direct variables on login/logout", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      const authObj = {
        expires_in: "e",
        user: "u",
        scope: "s",
        access_token: "at",
        id_token: "it",
        refresh_token: "rt",
      }
      // @ts-expect-error
      oidc.onUserLogin(authObj)
      setTimeout(() => {
        expect(oidc.user).toBeTruthy()
        expect(oidc.accessToken).toBeTruthy()
        expect(oidc.idToken).toBeTruthy()
        expect(oidc.scopes).toBeTruthy()
        expect(oidc.refreshToken).toBeTruthy()

        oidc.emit("user_logout")

        setTimeout(() => {
          expect(oidc.user).toBeFalsy()
          expect(oidc.accessToken).toBeFalsy()
          expect(oidc.idToken).toBeFalsy()
          expect(oidc.scopes).toBeFalsy()
          expect(oidc.refreshToken).toBeFalsy()
          done()
        })
      })
    })

    it('should start accessTokenRefresh timer when "autoSilentRenew" = true', (done) => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        autoSilentRenew: true,
        secondsToRefreshAccessTokenBeforeExp: 120,
      })
      // @ts-expect-error
      const origFn = oidc.synchronizer.CallOnce
      // @ts-expect-error
      oidc.synchronizer.CallOnce = jest.fn((ss, fn) => fn())

      oidc.silentLogin = jest.fn(async () => {
        return Promise.resolve()
      })
      // @ts-ignore
      oidc._accessTokenExpireTimer = {
        start: jest.fn((exp, cb) => {
          cb()
        }),
      }

      // @ts-expect-error
      oidc.onUserLogin({ access_token: "dummyToken", expires_in: 120, user: {} })
      setTimeout(() => {
        //@ts-expect-error
        expect(oidc._accessTokenExpireTimer.start).toBeCalled()
        // @ts-expect-error
        expect(oidc.synchronizer.CallOnce).toBeCalled()
        expect(oidc.silentLogin).toBeCalled()
        done()
        // @ts-expect-error
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
      oidc.authStore.get = jest.fn(() => Promise.resolve(storeEntry))

      for (const getter of getters) {
        expect(oidc).toHaveProperty(getter)
        expect(await oidc[getter]()).toBeTruthy()
      }
      expect(oidc.authStore.get).toBeCalledTimes(getters.length)
    })
  })

  describe(".initialize()", () => {
    it("should return initialized instance if it is already initialized", (done) => {
      const oidc = new OIDCClient({ issuer: "http://test.com", client_id: "test" })
      // @ts-expect-error
      expect(oidc.initialized).toBeFalsy()
      // @ts-expect-error
      oidc.fetchFromIssuer = jest.fn(async () => ({}))

      oidc
        .initialize(false)
        .then((client) => {
          // @ts-expect-error
          expect(oidc.initialized).toBe(true)

          oidc
            .initialize(false)
            .then((newClient) => {
              // @ts-expect-error
              expect(oidc.fetchFromIssuer).toBeCalledTimes(1)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it("should fetch issuer metadata when endpoints not provided", (done) => {
      const oidc = new OIDCClient({ issuer: "http://test.com", client_id: "test" })
      // @ts-expect-error
      oidc.fetchFromIssuer = jest.fn(async () => ({}))

      oidc
        .initialize(false)
        .then(() => {
          // @ts-expect-error
          expect(oidc.fetchFromIssuer).toBeCalled()
          done()
        })
        .catch(done)
    })

    it("should fail when metadata loading fails", (done) => {
      const oidc = new OIDCClient({ issuer: "http://test.com", client_id: "test" })
      // @ts-expect-error
      expect(oidc.initialized).toBeFalsy()
      // @ts-expect-error
      oidc.fetchFromIssuer = jest.fn(async () => {
        throw new OIDCClientError("failed")
      })

      oidc
        .initialize(false)
        .then((client) => {
          done("should fail")
        })
        .catch((err) => {
          expect(err).toBeInstanceOf(OIDCClientError)
          expect(err).toHaveProperty("error", "failed")
          done()
        })
    })

    it("should fail with generic error", (done) => {
      const oidc = new OIDCClient({ issuer: "http://test.com", client_id: "test" })
      // @ts-expect-error
      expect(oidc.initialized).toBeFalsy()
      // @ts-expect-error
      oidc.fetchFromIssuer = jest.fn(async () => {
        throw new Error("fails")
      })

      oidc
        .initialize(false)
        .then((client) => {
          done("should fail")
        })
        .catch((err) => {
          expect(err).toBeInstanceOf(OIDCClientError)
          expect(err).toHaveProperty("error", "fails")
          done()
        })
    })

    it("should initialize stores", (done) => {
      // @ts-ignore
      const mockedModule = jest.genMockFromModule("../src").LocalStorageStateStore as any
      const mockStore = new mockedModule()
      mockStore.init = jest.fn()
      const oidc = new OIDCClient({
        ...dummyOpts,
        stateStore: mockStore,
        authStore: mockStore,
      })
      oidc
        .initialize(false)
        .then((value) => {
          expect(mockStore.init).toBeCalledTimes(2)
          done()
        })
        .catch(done)
    })

    it("should silentLogin if `checkLogin` true", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.silentLogin = jest.fn(async () => {
        return Promise.resolve()
      })
      oidc
        .initialize()
        .then(() => {
          expect(oidc.silentLogin).toBeCalled()
          done()
        })
        .catch(done)
    })
    it("should clear authStore if login check fails", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.authStore.clear = jest.fn()
      oidc.silentLogin = jest.fn(async () => {
        return Promise.reject()
      })
      oidc
        .initialize()
        .then(() => {
          expect(oidc.silentLogin).toBeCalled()
          // @ts-expect-error
          expect(oidc.authStore.clear).toBeCalled()
          done()
        })
        .catch(done)
    })
  })

  describe(".isLoggedIn()", () => {
    it("should return local user if it exists", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.getUser = jest.fn(() => Promise.resolve({ user: "x" }))

      oidc
        .isLoggedIn()
        .then((value) => {
          expect(oidc.getUser).toBeCalled()
          expect(value).toBe(true)
          done()
        })
        .catch(done)
    })

    it("should silent login if local user does not exist", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.silentLogin = jest.fn(() => Promise.resolve({ user: "x" }))

      oidc
        .isLoggedIn()
        .then((value) => {
          expect(oidc.silentLogin).toBeCalled()
          expect(value).toBe(true)
          done()
        })
        .catch(done)
    })

    it("should return false when silent login fails", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.silentLogin = jest.fn(() => Promise.reject())

      oidc
        .isLoggedIn()
        .then((value) => {
          expect(oidc.silentLogin).toBeCalled()
          expect(value).toBe(false)
          done()
        })
        .catch(done)
    })
  })

  describe(".createAuthRequest()", () => {
    it("should try to fetch authorization endpoint uri", (done) => {
      const oidc = new OIDCClient({ ...dummyOpts, endpoints: {} })
      // @ts-expect-error
      oidc.fetchFromIssuer = jest.fn(() => {
        oidc.options.endpoints = dummyOpts.endpoints
      })

      // @ts-expect-error
      oidc.createAuthRequest().then(() => {
        // @ts-expect-error
        expect(oidc.fetchFromIssuer).toBeCalledTimes(1)
        done()
      })
    })
    it("should build uri", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.createAuthRequest().then((uri) => {
        expect(typeof uri).toBe("string")
        done()
      })
    })
    it("should store to state store", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.stateStore.set = jest.fn()

      // @ts-expect-error
      oidc.createAuthRequest().then((uri) => {
        // @ts-expect-error
        expect(oidc.stateStore.set).toBeCalled()
        done()
      })
    })

    it('should generate nonce if response type includes "id_token"', (done) => {
      const oidc = new OIDCClient({ ...dummyOpts, response_type: "id_token" })

      // @ts-expect-error
      oidc.createAuthRequest().then((uri) => {
        expect(uri).toMatch(/\&nonce=\w+\&?/)
        done()
      })
    })

    it("should use provided state length", (done) => {
      const oidc = new OIDCClient({ ...dummyOpts, stateLength: 16, response_type: "id_token" })

      // @ts-expect-error
      oidc.createAuthRequest().then((uri) => {
        expect(uri).toMatch(/\&state=\w+\&?/)
        expect(uri.match(/\&state=(\w+)\&?/)![1].length).toBe(16)
        done()
      })
    })

    it("should use provided nonce length", (done) => {
      const oidc = new OIDCClient({ ...dummyOpts, nonceLength: 16, response_type: "id_token" })

      // @ts-expect-error
      oidc.createAuthRequest().then((uri) => {
        expect(uri).toMatch(/\&nonce=\w+\&?/)
        expect(uri.match(/\&nonce=(\w+)\&?/)![1].length).toBe(16)
        done()
      })
    })

    it('should generate nonce if scope includes "openid"', (done) => {
      const oidc = new OIDCClient({ ...dummyOpts, response_type: "code", scope: "openid profile" })
      // @ts-expect-error
      oidc.createAuthRequest().then((uri) => {
        expect(uri).toMatch(/\&nonce=\w+\&?/)
        done()
      })
    })

    it("should include passed options in request", (done) => {
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
      oidc.createAuthRequest().then((uri) => {
        Object.keys(authParams).forEach((param) => {
          expect(uri).toMatch(new RegExp(`\\&?${param}=${authParams[param]}\\&?`))
        })
        done()
      })
    })

    it("should include extra params in auth query", (done) => {
      const extraParams: Record<string, any> = {
        test: 1,
        test2: 2,
      }

      const oidc = new OIDCClient({
        ...dummyOpts,
        extraParams,
      })
      // @ts-expect-error
      oidc.createAuthRequest().then((uri) => {
        Object.keys(extraParams).forEach((param) => {
          expect(uri).toMatch(new RegExp(`\\&?${param}=${extraParams[param]}\\&?`))
        })
        done()
      })
    })

    it('should generate code_challenge if response type includes "code"', (done) => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.stateStore.set = jest.fn()

      // @ts-ignore
      deriveChallenge = jest.fn(async () => "code_challenge")
      oidc
        // @ts-expect-error
        .createAuthRequest()
        .then((uri) => {
          expect(uri).toMatch(/\&code_challenge=code_challenge\&/)
          expect(uri).toMatch(/\&code_challenge_method=S256+\&?/)
          expect(deriveChallenge).toBeCalled()
          // @ts-ignore
          deriveChallenge.mockRestore()
          done()
        })
        .catch(() => {
          // @ts-ignore
          deriveChallenge.mockRestore()
        })
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
    it("should fail without `code`", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc
        // @ts-expect-error
        .exchangeAuthorizationCode({})
        .then(done.bind(null, "should not succeed"))
        .catch((err) => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"code" is required')
          done()
        })
    })

    it("should fail without `redirect_uri`", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc
        // @ts-expect-error
        .exchangeAuthorizationCode({ code: "test" })
        .then(done.bind(null, "should not succeed"))
        .catch((err) => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"redirect_uri" is required')
          done()
        })
    })

    it("should fail without `code_verifier`", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc
        // @ts-expect-error
        .exchangeAuthorizationCode({ code: "test", redirect_uri: "test" })
        .then(done.bind(null, "should not succeed"))
        .catch((err) => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"code_verifier" is required')
          done()
        })
    })

    it("should fail without `client_id`", (done) => {
      // @ts-expect-error
      const oidc = new OIDCClient({ issuer: "http://test.com/" })
      oidc
        // @ts-expect-error
        .exchangeAuthorizationCode({ code: "test", redirect_uri: "test", code_verifier: "test" })
        .then(done.bind(null, "should not succeed"))
        .catch((err) => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"client_id" is required')
          done()
        })
    })

    it("should exchange code", (done) => {
      const oidc = new OIDCClient(dummyOpts)

      oidc
        // @ts-expect-error
        .exchangeAuthorizationCode({ code: "test", redirect_uri: "test", code_verifier: "test" })
        .then(() => {
          expect(mockedFetch).toBeCalledTimes(1)
          done()
        })
        .catch(done)
    })

    it("should use client_secret", (done) => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        client_secret: "test_secret",
        redirect_uri: "http://localhost:8080",
      })

      oidc
        // @ts-expect-error
        .handleAuthResponse({ code: "test" }, {}, { code_verifier: "test" })
        .then(() => {
          expect(mockedFetch).toBeCalledTimes(1)
          done()
        })
        .catch(done)
    })
  })

  describe(".exchangeRefreshToken()", () => {
    it("should fail without `refresh_token`", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc
        // @ts-expect-error
        .exchangeRefreshToken({})
        .then(() => done("should not succeed"))
        .catch((err) => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"refresh_token" is required')
          done()
        })
    })

    it("should fail without `client_id`", (done) => {
      // @ts-expect-error
      const oidc = new OIDCClient({ issuer: "http://test.com/" })
      oidc
        // @ts-expect-error
        .exchangeRefreshToken({ refresh_token: "test" })
        .then(() => done("should not succeed"))
        .catch((err) => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"client_id" is required')
          done()
        })
    })

    it("should exchange refresh token", (done) => {
      const oidc = new OIDCClient(dummyOpts)

      oidc
        // @ts-expect-error
        .exchangeRefreshToken({ refresh_token: "test" })
        .then(() => {
          expect(mockedFetch).toBeCalledTimes(1)
          done()
        })
        .catch(done)
    })
  })

  describe(".fetchFromIssuer()", () => {
    it("should fetch", () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.fetchFromIssuer().then(() => {
        expect(mockedFetch).toBeCalledTimes(1)
      })
    })

    it("should fail with generic error", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.http = jest.fn(async () => {
        throw new Error("fails")
      })
      oidc
        // @ts-expect-error
        .fetchFromIssuer()
        .then(() => {
          done("should not succeed")
        })
        .catch((err) => {
          expect(err).toBeInstanceOf(OIDCClientError)
          expect(err).toHaveProperty("error", "Loading metadata failed")
          expect(err).toHaveProperty("error_description", "fails")
          done()
        })
    })
  })

  describe(".fetchUserInfo()", () => {
    it("should fetch", () => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.fetchUserInfo("token").then(() => {
        expect(mockedFetch).toBeCalledTimes(1)
      })
    })
  })

  describe(".revokeToken()", () => {
    it("should revoke", (done) => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        endpoints: {
          revocation_endpoint: "dummy_revoke",
        },
      })
      oidc
        .revokeToken("token")
        .then(() => {
          expect(mockedFetch).toBeCalledTimes(1)
          done()
        })
        .catch(done)
    })

    it('should fail without "revocation_endpoint"', (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc
        .revokeToken("token")
        .then(() => done("should not succeed"))
        .catch((err) => {
          expect(err).toBeInstanceOf(OIDCClientError)
          expect(err.message).toBe('"revocation_endpoint" doesn\'t exist')
          done()
        })
    })
  })

  describe(".loadState()", () => {
    it("should retrieve stored state", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      const mockedGet = (oidc.stateStore.get = jest.fn(async (state) => {
        if (state === "exist") {
          return true
        }
        return false
      }))
      // @ts-expect-error
      const mockedDel = (oidc.stateStore.del = jest.fn(async (state) => {
        if (state === "exist") {
          return true
        }
        return false
      }))

      oidc
        // @ts-expect-error
        .loadState("exist")
        .then((storedState) => {
          expect(mockedGet).toBeCalled()
          expect(mockedDel).toBeCalled()
          done()
        })
        .catch(done)
    })

    it("should fail if state does not exist", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      const mockedGet = (oidc.stateStore.get = jest.fn(async (state) => {
        if (state === "exist") {
          return true
        }
        return false
      }))

      oidc
        // @ts-expect-error
        .loadState("notExists")
        .then(done)
        .catch((err) => {
          expect(mockedGet).toBeCalled()
          expect(err).toBeInstanceOf(StateNotFound)
          expect(err.message).toBe("Local state not found")
          done()
        })
    })
  })

  describe(".handleAuthResponse()", () => {
    it("should handle", (done) => {
      const oidc = new OIDCClient(dummyOpts)

      oidc
        // @ts-expect-error
        .handleAuthResponse({ param: "value" }, {}, {})
        .then((resp) => {
          expect(resp).toStrictEqual({ param: "value" })
          done()
        })
        .catch(done)
    })

    it("should exchange code", (done) => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.exchangeAuthorizationCode = jest.fn(async () => ({}))
      oidc
        // @ts-expect-error
        .handleAuthResponse({ code: "code" }, {}, {})
        .then((resp) => {
          // @ts-expect-error
          expect(oidc.exchangeAuthorizationCode).toBeCalled()
          done()
        })
        .catch(done)
    })
  })

  describe(".handleTokenResult()", () => {
    let mockedValidator: jest.Mock<any, any>
    beforeAll(() => {
      mockedValidator = jest.fn().mockReturnValue(
        Promise.resolve({
          nonce: "nonUserClaim",
          first_name: "first",
        }),
      )
      // @ts-ignore
      joseUtils.validateIdToken = mockedValidator
    })

    afterEach(() => mockedValidator.mockClear())
    afterAll(() => mockedValidator.mockRestore())

    it("should handle", (done) => {
      const oidc = new OIDCClient(dummyOpts)

      oidc
        // @ts-expect-error
        .handleTokenResult({}, {}, {})
        .then((resp) => {
          expect(resp).toEqual({ authParams: {}, scope: undefined, user: {} })
          done()
        })
        .catch(done)
    })

    it('should handle "id_token"', (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc
        // @ts-expect-error
        .handleTokenResult({ id_token: "test" }, {}, {})
        .then((resp) => {
          expect(mockedValidator).toBeCalled()
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
          done()
        })
        .catch(done)
    })

    it('should call custom "idTokenValidator"', (done) => {
      const customValidator = jest.fn(async () => Promise.resolve(false))
      const oidc = new OIDCClient(dummyOpts)
      oidc
        // @ts-expect-error
        .handleTokenResult({ id_token: "test" }, {}, { idTokenValidator: customValidator })
        .then(() => done("should not succeed"))
        .catch((err) => {
          expect(mockedValidator).toBeCalled()
          expect(customValidator).toBeCalled()
          expect(err).toBeInstanceOf(InvalidIdTokenError)
          expect(err.message).toBe("Id Token validation failed")
          done()
        })
    })
    it('should handle "access_token"', (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc
        // @ts-expect-error
        .handleTokenResult({ access_token: "test" }, {}, {})
        .then((resp) => {
          expect(resp).toEqual({
            authParams: {},
            access_token: "test",
            scope: undefined,
            user: {},
          })
          done()
        })
        .catch(done)
    })

    it('should fetch user info when "requestUserInfo" = true', (done) => {
      const oidc = new OIDCClient({
        ...dummyOpts,
        endpoints: {
          userinfo_endpoint: "user_info_endpoint",
        },
      })
      // @ts-expect-error
      oidc.fetchUserInfo = jest.fn().mockReturnValue({ sub: "test" })
      oidc
        // @ts-expect-error
        .handleTokenResult(
          { access_token: "dummyToken" },
          {},
          // @ts-expect-error
          {
            requestUserInfo: true,
          },
        )
        .then((resp) => {
          // @ts-expect-error
          expect(oidc.fetchUserInfo).toBeCalledWith("dummyToken")
          expect(resp).toEqual({
            authParams: {},
            access_token: "dummyToken",
            scope: undefined,
            user: { sub: "test" },
          })
          done()
        })
        .catch(done)
    })

    it("should fail on error response", (done) => {
      const oidc = new OIDCClient(dummyOpts)

      oidc
        // @ts-expect-error
        .handleTokenResult({ error: "error", error_description: "invalid_client" }, {}, {})
        .then(() => done)
        .catch((err) => {
          expect(err).toBeInstanceOf(AuthenticationError)
          expect(err).toMatchObject({ error: "error", error_description: "invalid_client" })
          done()
        })
    })
  })

  describe(".login()", () => {
    beforeAll(() => {
      // @ts-ignore
      delete window.location
      // @ts-ignore
      window.location = { assign: jest.fn() }
      jest.spyOn(window.location, "assign")
    })
    it("should navigate the window to auth request", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.login().then(() => {
        expect(window.location.assign).toBeCalled()
        done()
      })
    })
  })

  describe(".loginWithPopup()", () => {
    it("should execute popup and handle auth result", (done) => {
      const mockedRunPopup = jest.fn(async () => {
        return { response: { state: "test" }, state: { authParams: {}, localState: {} } }
      })
      // @ts-expect-error
      popupUtils["runPopup"] = mockedRunPopup
      const oidc = new OIDCClient(dummyOpts)

      const authResult = { user: "x" }

      // @ts-ignore
      oidc.exchangeAuthorizationCode = jest.fn(async () => ({}))
      // @ts-ignore
      oidc.handleTokenResult = jest.fn(async () => authResult)

      const onLogin = jest.fn()
      oidc.on(Events.USER_LOGIN, onLogin)
      oidc.loginWithPopup().then(() => {
        expect(mockedRunPopup).toBeCalled()
        expect(onLogin).toBeCalledWith(authResult)
        done()
      })
    })

    it("should throw interaction error when user closes popup", (done) => {
      const mockedRunPopup = jest.fn(async () => {
        throw new InteractionCancelled("user closed")
      })
      // @ts-expect-error
      popupUtils["runPopup"] = mockedRunPopup
      const oidc = new OIDCClient(dummyOpts)

      const authResult = { user: "x" }

      // @ts-ignore
      oidc.exchangeAuthorizationCode = jest.fn(async () => ({}))
      // @ts-ignore
      oidc.handleTokenResult = jest.fn(async () => authResult)

      oidc
        .loginWithPopup()
        .catch((err) => {
          expect(err).toBeInstanceOf(InteractionCancelled)
          done()
          return "passed"
        })
        .then((v) => v !== "passed" && done(new Error("login with popup should fail")))
    })
  })

  describe(".monitorSession()", () => {
    const originalFn = checkSessionUtils["createSessionCheckerFrame"]
    const mockedChecker = jest.fn(() => {
      return { start: mockedStart, stop: mockedStop }
    })
    const mockedStart = jest.fn()
    const mockedStop = jest.fn()
    const oidcOpts = {
      ...dummyOpts,
      endpoints: {
        check_session_iframe: "http://example.com/example",
      },
    }
    beforeEach(() => {
      // @ts-expect-error
      checkSessionUtils["createSessionCheckerFrame"] = mockedChecker
    })
    afterEach(() => {
      // @ts-expect-error
      checkSessionUtils["createSessionCheckerFrame"] = originalFn
    })

    it('should not run if "check_session_iframe" not exists', () => {
      const oidc = new OIDCClient(dummyOpts)
      jest.spyOn(console, "warn")

      // @ts-expect-error
      oidc.monitorSession({})
      expect(console.warn).toBeCalledWith(
        '"check_session_iframe" endpoint missing or session management is not supported by provider',
      )
    })

    it("should should create session checker if not exists", () => {
      const oidc = new OIDCClient(oidcOpts)

      const session_state = "state"
      // @ts-expect-error
      oidc.monitorSession({ sub: "s", session_state })

      expect(checkSessionUtils["createSessionCheckerFrame"]).toBeCalled()
      expect(mockedStart).toBeCalledWith(session_state)
    })
  })

  describe(".loginCallback()", () => {
    it("should fail if no url is passed", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      const oldWindow = window.location
      // @ts-ignore
      delete window.location
      oidc.loginCallback().catch((e) => {
        expect(e).toBeInstanceOf(OIDCClientError)
        expect(e.message).toBe("Url must be passed to handle login redirect")
        done()
      })
      window.location = oldWindow as any
    })
    it("should fail if wrong url is passed", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.loginCallback("wrongUrlformat#asdasdasd").catch((e) => {
        expect(e).toBeInstanceOf(OIDCClientError)
        expect(e.message).toBe('Invalid callback url passed: "wrongUrlformat#asdasdasd"')
        done()
      })
    })

    it("should exchange auth code ", (done) => {
      const authObj = { user: { sub: "test" } }

      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.loadState = jest.fn(async () => ({ authParams: {}, localState: {}, request_type: "d" }))
      // @ts-expect-error
      oidc.exchangeAuthorizationCode = jest.fn()
      // @ts-expect-error
      oidc.handleTokenResult = jest.fn(async () => authObj)

      const onLogin = jest.fn()
      oidc.on(Events.USER_LOGIN, onLogin)

      oidc.loginCallback("http://example.com?code=1q2w3e4r&state=123456").then(() => {
        // @ts-expect-error
        expect(oidc.loadState).toBeCalledWith("123456")
        expect(onLogin).toBeCalledWith(authObj)
        done()
      })
    })
    it("should fail if auth request failed", (done) => {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.loadState = jest.fn(async () => ({ authParams: {}, localState: {}, request_type: "d" }))

      oidc
        .loginCallback("http://example.com?error=auth_error&error_description=failed&state=123456")
        .catch((e) => {
          // @ts-expect-error
          expect(oidc.loadState).toBeCalledWith("123456")
          expect(e).toBeInstanceOf(AuthenticationError)
          done()
        })
    })

    it("should notify parent if it is called from embedded document", (done) => {
      Object.defineProperty(window, "frameElement", {
        value: "123",
      })

      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.loadState = jest.fn(async () => ({ authParams: {}, localState: {}, request_type: "s" }))

      window.parent.postMessage = jest.fn()
      oidc.loginCallback("http://example.com?code=1q2w3e4r&state=123456").then(() => {
        // @ts-expect-error
        expect(oidc.loadState).toBeCalledWith("123456")
        expect(window.parent.postMessage).toBeCalledWith(
          {
            type: "authorization_response",
            response: { code: "1q2w3e4r", state: "123456" },
            state: { authParams: {}, localState: {}, request_type: "s" },
          },
          `${window.location.protocol}//${window.location.host}`,
        )
        done()
      })
    })

    it("should notify parent if it is called from popup", (done) => {
      Object.defineProperty(window, "opener", {
        value: {},
      })

      const oidc = new OIDCClient(dummyOpts)

      const state = { authParams: {}, localState: {}, request_type: "p" }
      // @ts-expect-error
      oidc.loadState = jest.fn(async () => state)

      window.opener!.postMessage = jest.fn()
      oidc.loginCallback("http://example.com?code=1q2w3e4r&state=123456").then(() => {
        // @ts-expect-error
        expect(oidc.loadState).toBeCalledWith("123456")
        expect(window.opener!.postMessage).toBeCalledWith(
          {
            type: "authorization_response",
            response: { code: "1q2w3e4r", state: "123456" },
            state,
          },
          `${window.location.protocol}//${window.location.host}`,
        )
        done()
      })
    })
  })

  describe(".silentLogin()", () => {
    it("should use refresh_token if there is one", (done) => {
      const oidc = new OIDCClient({ ...dummyOpts, useRefreshToken: true })

      const authObj = { user: { sub: "test" } }
      // @ts-expect-error
      oidc.exchangeRefreshToken = jest.fn()
      // @ts-expect-error
      oidc.handleTokenResult = jest.fn(async () => authObj)
      // @ts-expect-error
      oidc.authStore.set("auth", { refresh_token: "dummyToken" })

      const onLogin = jest.fn()
      oidc.on(Events.USER_LOGIN, onLogin)
      oidc.silentLogin().then(() => {
        // @ts-expect-error
        expect(oidc.exchangeRefreshToken).toBeCalled()
        // @ts-expect-error
        expect(oidc.handleTokenResult).toBeCalled()
        expect(onLogin).toBeCalledWith(authObj)
        done()
      })
    })

    it("should use silent_redirect_uri as redirect_uri if passed", (done) => {
      const mockedRunIFrame = jest.fn(async () => {
        return { response: { state: "test" }, state: {} }
      })
      // @ts-expect-error
      iframeUtils["runIframe"] = mockedRunIFrame
      const oidc = new OIDCClient({
        ...dummyOpts,
        silent_redirect_uri: "silent_redirect_uri",
        redirect_uri: "redirect_uri",
      })

      const authObj = { user: { sub: "test" } }
      // @ts-expect-error
      oidc.createAuthRequest = jest.fn((opts) => {
        expect(opts!.redirect_uri).toBe("silent_redirect_uri")
        return
      })
      // @ts-expect-error
      oidc.exchangeRefreshToken = jest.fn()
      // @ts-expect-error
      oidc.handleTokenResult = jest.fn(async () => authObj)

      // @ts-expect-error
      oidc.authStore.set("auth", {})

      const onLogin = jest.fn()
      oidc.on(Events.USER_LOGIN, onLogin)
      oidc
        .silentLogin()
        .then(() => {
          // @ts-expect-error
          expect(oidc.createAuthRequest).toBeCalled()
          // @ts-expect-error
          expect(oidc.handleTokenResult).toBeCalled()
          expect(onLogin).toBeCalledWith(authObj)
          done()
        })
        .catch(done)
    })

    it("should make auth request if refresh tokens are not used", (done) => {
      const mockedRunIFrame = jest.fn(async () => {
        return { response: { state: "test" }, state: {} }
      })
      // @ts-expect-error
      iframeUtils["runIframe"] = mockedRunIFrame

      const oidc = new OIDCClient(dummyOpts)

      const authObj = { user: { sub: "test" } }
      // @ts-expect-error
      oidc.createAuthRequest = jest.fn()
      // @ts-expect-error
      oidc.handleAuthResponse = jest.fn()
      // @ts-expect-error
      oidc.exchangeAuthorizationCode = jest.fn()
      // @ts-expect-error
      oidc.handleTokenResult = jest.fn(async () => authObj)
      // @ts-expect-error
      oidc.authStore.set("auth", {})

      const onLogin = jest.fn()
      oidc.on(Events.USER_LOGIN, onLogin)
      oidc.silentLogin().then(() => {
        // @ts-expect-error
        expect(oidc.handleAuthResponse).toBeCalled()
        // @ts-expect-error
        expect(oidc.handleTokenResult).toBeCalled()
        expect(onLogin).toBeCalledWith(authObj)
        done()
      })
    })

    // it('should clear auth store on any error', function (done) {
    //   const oidc = new OIDCClient({...dummyOpts, useRefreshToken: true})
    //
    //   const authObj = { user: { sub: 'test'}}
    //   // @ts-expect-error
    //   oidc.exchangeRefreshToken = jest.fn(async () => Promise.reject())
    //   // @ts-expect-error
    //   oidc.authStore.set('auth', { refresh_token: 'dummyToken'})
    //
    //   // @ts-ignore
    //   jest.spyOn(oidc.authStore, "clear")
    //   const onLogin = jest.fn()
    //   oidc.on(Events.USER_LOGIN, onLogin )
    //   oidc.silentLogin().then(function () {
    //     // @ts-expect-error
    //     expect(oidc.exchangeRefreshToken).toBeCalled()
    //     // @ts-expect-error
    //     expect(oidc.authStore.clear).toBeCalled()
    //     done()
    //   })
    // });
  })

  describe(".logout()", () => {
    const oldLocation = window.location
    beforeEach(() => {
      // @ts-ignore
      delete window.location
      // @ts-ignore
      window.location = { assign: jest.fn() }
      jest.spyOn(window.location, "assign")
    })
    afterEach(() => {
      window.location = oldLocation as any
    })

    it("should redirect window to logout uri", (done) => {
      const oidc = new OIDCClient(dummyOpts)
      oidc.logout().then(() => {
        expect(window.location.assign).toBeCalled()
        done()
      })
    })

    it('should clear only from local if "localOnly" = true', (done) => {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      jest.spyOn(oidc.authStore, "clear")

      oidc.logout({ localOnly: true }).then(() => {
        // @ts-expect-error
        expect(oidc.authStore.clear).toBeCalled()
        expect(window.location.assign).not.toBeCalled()
        done()
      })
    })
  })
})
