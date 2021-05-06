import fetch from "isomorphic-unfetch";
import * as joseUtils from '../src/utils/jose'
import * as popupUtils from '../src/utils/popup'
import * as iframeUtils from '../src/utils/iframe'
import * as checkSessionUtils from '../src/utils/check_session_iframe'
jest.mock('isomorphic-unfetch', () => {
  return {
    default: jest.fn().mockReturnValue(new Promise(resolve => {
      resolve({
        json: () => ({})
      })
    }))
  }
});
jest.mock( 'broadcast-channel', () => {
  return {
    createLeaderElection: jest.fn(),
    BroadcastChannel: class {

    }
  }
})


import {
  AuthenticationError,
  Events,
  InMemoryStateStore,
  InvalidIdTokenError,
  LocalStorageStateStore,
  OIDCClient,
  OIDCClientError
} from "../src";
import {Timer} from "../src/helpers/timer";
import {deriveChallenge} from "../src/utils/jose";


const mockedFetch = <jest.Mock> fetch

const dummyOpts = {
  issuer: 'https://test.plusauth.com/',
  client_id: 'test',
  endpoints: { authorization_endpoint: 'dummy_auth'}
}
describe('oidc client', function (){
  afterEach(() => {
    mockedFetch.mockClear()
  })

  describe('[constructor]', function (){

    it('should accept valid issuer', function (done) {
      const validIssuers = [
        'http://example.co:8000',
        'example.co:8000',
        'example.co',
        'example.com',
        'example.org',
        'https://example.org',
        'https://a.b.example.com',
        'https://example.co',
        'https://example.io',
        'https://example.co:8000',
        'https://test.plusauth.com',
      ]

      validIssuers.forEach(issuer=> {
        try {
          new OIDCClient({issuer, client_id: ''})
        }catch (e) {
          done.fail(e +' : ' + issuer)
        }
      })
      done()
    });

    it('should fail with invalid issuers', function (done) {
      const invalidIssuers = [
        "ftp://something",
        "http:www.example.com",
        "http://www.example.com\\",
      ]
      invalidIssuers.forEach(issuer=> {
        try {
          new OIDCClient({issuer, client_id: ''})
          done.fail('should fail with: ' + issuer)
        }catch (e) {
          expect(e).toBeInstanceOf(OIDCClientError)
          expect(e.message).toBe('"issuer" must be a valid uri.')
        }
      })
      done()
    });

    it('should remove last slash from issuer uri', function () {
      const oidc = new OIDCClient(dummyOpts)

      expect(oidc.options.issuer).toBe('https://test.plusauth.com')
    });

    it('should be an event source', function () {
      const oidc = new OIDCClient(dummyOpts)
      expect(oidc).toHaveProperty('emit')
      expect(oidc).toHaveProperty('on')
      expect(oidc).toHaveProperty('once')
      expect(oidc).toHaveProperty('off')
    });

    it('should apply defaults', function () {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      expect(oidc.authStore).toBeInstanceOf(InMemoryStateStore)
      // @ts-expect-error
      expect(oidc.stateStore).toBeInstanceOf(LocalStorageStateStore)

    });

    it('should create access token timer if `autoSilentRenew` enabled', function () {
      const oidc = new OIDCClient({...dummyOpts, autoSilentRenew: true})
      // @ts-expect-error
      expect(oidc._accessTokenExpireTimer).toBeInstanceOf(Timer)
    });


    it('should set/clear direct variables on login/logout', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      const authObj = { expires_in: 'e', user: 'u', scope: 's', access_token: 'at', id_token:'it', refresh_token:'rt' }
      oidc.emit('user_login', authObj)
      setTimeout(()=>{
        expect(oidc.user).toBeTruthy()
        expect(oidc.accessToken).toBeTruthy()
        expect(oidc.idToken).toBeTruthy()
        expect(oidc.scopes).toBeTruthy()
        expect(oidc.refreshToken).toBeTruthy()

        oidc.emit('user_logout')

        setTimeout( () => {
          expect(oidc.user).toBeFalsy()
          expect(oidc.accessToken).toBeFalsy()
          expect(oidc.idToken).toBeFalsy()
          expect(oidc.scopes).toBeFalsy()
          expect(oidc.refreshToken).toBeFalsy()
          done()
        })
      })
    });

    it('should start accessTokenRefresh timer when "autoSilentRenew" = true', function (done) {
      const oidc = new OIDCClient({...dummyOpts,
      autoSilentRenew: true,
        secondsToRefreshAccessTokenBeforeExp: 120
      })

      // @ts-ignore
      oidc.leaderElector = {
        awaitLeadership: jest.fn()
      }
      oidc.silentLogin = jest.fn( async () => {
        return Promise.resolve()
      })
      // @ts-ignore
      oidc._accessTokenExpireTimer = {
        start: jest.fn((exp, cb)=> {
          cb()
        })
      }

      oidc.emit('user_login', {access_token: 'dummyToken', expires_in: 120, user: {}})
      setTimeout(() => {
        //@ts-expect-error
        expect(oidc._accessTokenExpireTimer.start).toBeCalled()
        //@ts-expect-error
        expect(oidc.leaderElector.awaitLeadership).toBeCalled()
        expect(oidc.silentLogin).toBeCalled()
        done()
      })
    });

  })

  describe('[getters]', function (){
    it('should work', function (done) {

      const getters = [
        'getAccessToken',
        'getRefreshToken',
        'getIdToken',
        'getScopes',
        'getUser',
      ]
      const oidc = new OIDCClient(dummyOpts) as any
      oidc.authStore.get = jest.fn(()=> Promise.resolve())

      Promise.all( getters.map(getter => {
        expect(oidc).toHaveProperty(getter)
        return oidc[getter]();
      }) ).then(()=>{
        expect(oidc.authStore.get).toBeCalledTimes(getters.length)
        done()
      }).catch(done.fail)

    });
  })

  describe('.initialize()', function (){
    it('should return initialized instance if it is already initialized', function (done) {
      const oidc = new OIDCClient({ issuer: 'http://test.com', client_id: 'test'})
      // @ts-expect-error
      expect(oidc.initialized).toBeFalsy()
      // @ts-expect-error
      oidc.fetchFromIssuer = jest.fn(async ()=> ({}))

      oidc.initialize(false).then( client => {
        // @ts-expect-error
        expect(oidc.initialized).toBe(true)

        oidc.initialize(false).then( newClient => {
          // @ts-expect-error
          expect(oidc.fetchFromIssuer).toBeCalledTimes(1)
          done()
        }).catch(done.fail)
      }).catch(done.fail)

    });

    it('should fetch issuer metadata when endpoints not provided', function (done) {
      const oidc = new OIDCClient({ issuer: 'http://test.com', client_id: 'test'})
      // @ts-expect-error
      oidc.fetchFromIssuer = jest.fn(async ()=> ({
        'authorization_endpoint': 'dummy',
        'check_session_iframe': 'dummyCheck',
        'jwks_uri': 'dummyUri',
        'additional_opt': 'additional'
      }))

      oidc.initialize(false).then(()=>{
        // @ts-expect-error
        expect(oidc.fetchFromIssuer).toBeCalled()

        expect(oidc.options.endpoints).toEqual({
          'authorization_endpoint': 'dummy',
          'check_session_iframe': 'dummyCheck',
          'jwks_uri': 'dummyUri',
        })
        expect(oidc.issuer_metadata).toHaveProperty('additional_opt', 'additional')
        done()
      }).catch(done.fail)
    });

    it('should initialize stores', function (done) {
      // @ts-ignore
      const mockedModule = jest.genMockFromModule('../src').LocalStorageStateStore as any
      const mockStore = new mockedModule()
      mockStore.init = jest.fn( )
      const oidc = new OIDCClient({
        ...dummyOpts,
        stateStore: mockStore,
        authStore: mockStore
      })
      oidc.initialize(false)
        .then(value => {
          expect(mockStore.init).toBeCalledTimes(2)
          done()
        }).catch(done.fail)
    });

    it('should silentLogin if `checkLogin` true', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      oidc.silentLogin = jest.fn( async () => {
        return Promise.resolve()
      })
      oidc.initialize()
        .then(() => {
          expect(oidc.silentLogin).toBeCalled()
          done()
        }).catch(done.fail)
    });
    it('should clear authStore if login check fails', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.authStore.clear = jest.fn()
      oidc.silentLogin = jest.fn( async () => {
        return Promise.reject()
      })
      oidc.initialize()
        .then(() => {
          expect(oidc.silentLogin).toBeCalled()
          // @ts-expect-error
          expect(oidc.authStore.clear).toBeCalled()
          done()
        }).catch(done.fail)
    });
  })

  describe('.isLoggedIn()', function (){
    it('should return local user if it exists', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      oidc.getUser = jest.fn(()=> Promise.resolve({ user: 'x'}))

      oidc.isLoggedIn().then((value) => {
        expect(oidc.getUser).toBeCalled()
        expect(value).toBe(true)
        done()
      }).catch(done.fail)
    });

    it('should silent login if local user does not exist', function (done) {

      const oidc = new OIDCClient(dummyOpts)
      oidc.silentLogin = jest.fn(()=> Promise.resolve({ user: 'x'}))

      oidc.isLoggedIn().then((value) => {
        expect(oidc.silentLogin).toBeCalled()
        expect(value).toBe(true)
        done()
      }).catch(done.fail)
    });

    it('should return false when silent login fails', function (done) {

      const oidc = new OIDCClient(dummyOpts)
      oidc.silentLogin = jest.fn(()=> Promise.reject())

      oidc.isLoggedIn().then((value) => {
        expect(oidc.silentLogin).toBeCalled()
        expect(value).toBe(false)
        done()
      }).catch(done.fail)
    });
  })

  describe('.createAuthRequest()', function () {
    it('should build uri', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.createAuthRequest().then( uri => {
        expect(typeof uri).toBe("string")
        done()
      })
    });
    it('should store to state store', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.stateStore.set = jest.fn()

      // @ts-expect-error
      oidc.createAuthRequest().then( uri => {
        // @ts-expect-error
        expect(oidc.stateStore.set).toBeCalled()
        done()
      })
    });

    it('should generate nonce if response type includes "id_token"', function (done) {
      const oidc = new OIDCClient({...dummyOpts, response_type: 'id_token'})

      // @ts-expect-error
      oidc.createAuthRequest().then( uri => {
        expect(uri).toMatch(/\&nonce=\w+\&?/)
        done()
      })
    });

    it('should generate nonce if scope includes "openid"', function (done) {
      const oidc = new OIDCClient({...dummyOpts, response_type: 'code', scope: 'openid profile'})
      // @ts-expect-error
      oidc.createAuthRequest().then( uri => {
        expect(uri).toMatch(/\&nonce=\w+\&?/)
        done()
      })
    });

    it('should generate code_challenge if response type includes "code"', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.stateStore.set = jest.fn()

      // @ts-ignore
      deriveChallenge = jest.fn( async () => "code_challenge")
      // @ts-expect-error
      oidc.createAuthRequest().then( uri => {
        expect(uri).toMatch(/\&code_challenge=code_challenge\&/)
        expect(uri).toMatch(/\&code_challenge_method=S256+\&?/)
        expect(deriveChallenge).toBeCalled()
        // @ts-ignore
        deriveChallenge.mockRestore()
        done()
      }).catch(() => {
        // @ts-ignore
        deriveChallenge.mockRestore()
      })
    });
  })

  describe('.createLogoutRequest()', function () {
    it('should build uri', function () {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      const uri = oidc.createLogoutRequest()
      expect(typeof uri).toBe("string")
    });
  })

  describe('.exchangeAuthorizationCode()', function (){

    it('should fail without `code`', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.exchangeAuthorizationCode({})
        .then(done.fail.bind(null, 'should not succeed'))
        .catch( err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"code" is required')
          done()
        })
    });

    it('should fail without `redirect_uri`', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.exchangeAuthorizationCode({code: 'test'})
        .then(done.fail.bind(null, 'should not succeed'))
        .catch( err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"redirect_uri" is required')
          done()
        })
    });

    it('should fail without `code_verifier`', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.exchangeAuthorizationCode({code: 'test', redirect_uri: 'test'})
        .then(done.fail.bind(null, 'should not succeed'))
        .catch( err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"code_verifier" is required')
          done()
        })
    });

    it('should fail without `client_id`', function (done) {
      // @ts-expect-error
      const oidc = new OIDCClient({issuer: 'http://test.com/'})
      // @ts-expect-error
      oidc.exchangeAuthorizationCode({code: 'test', redirect_uri: 'test', code_verifier: 'test'})
        .then(done.fail.bind(null, 'should not succeed'))
        .catch( err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"client_id" is required')
          done()
        })
    });

    it('should exchange code', function (done) {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.exchangeAuthorizationCode({code: 'test', redirect_uri: 'test', code_verifier: 'test'})
        .then(()=>{
          expect(mockedFetch).toBeCalledTimes(1)
          done()
        }).catch(done.fail)
    });

  })

  describe('.exchangeRefreshToken()', function (){

    it('should fail without `refresh_token`', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.exchangeRefreshToken({})
        .then(done.fail.bind(null, 'should not succeed'))
        .catch( err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"refresh_token" is required')
          done()
        })
    });


    it('should fail without `client_id`', function (done) {
      // @ts-expect-error
      const oidc = new OIDCClient({issuer: 'http://test.com/'})
      // @ts-expect-error
      oidc.exchangeRefreshToken({refresh_token: 'test'})
        .then(done.fail.bind(null, 'should not succeed'))
        .catch( err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toBe('"client_id" is required')
          done()
        })
    });

    it('should exchange refresh token', function (done) {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.exchangeRefreshToken({refresh_token: 'test'})
        .then(()=>{
          expect(mockedFetch).toBeCalledTimes(1)
          done()
        }).catch(done.fail)
    });

  })

  describe('.fetchFromIssuer()', function () {
    it('should fetch', function () {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.fetchFromIssuer().then(() => {
        expect(mockedFetch).toBeCalledTimes(1)
      })
    });
  })

  describe('.fetchUserInfo()', function () {
    it('should fetch', function () {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.fetchUserInfo('token').then(() => {
        expect(mockedFetch).toBeCalledTimes(1)
      })
    });
  })

  describe('.revokeToken()', function () {
    it('should revoke', function (done) {
      const oidc = new OIDCClient({...dummyOpts, endpoints: {
          revocation_endpoint: 'dummy_revoke'
        }})
      oidc.revokeToken('token').then(() => {
        expect(mockedFetch).toBeCalledTimes(1)
        done()
      }).catch(done.fail)
    });

    it('should fail without "revocation_endpoint"', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      oidc.revokeToken('token')
        .then(done.fail.bind(null, 'should not succeed'))
        .catch((err)=> {
          expect(err).toBeInstanceOf(OIDCClientError)
          expect(err.message).toBe('"revocation_endpoint" doesn\'t exist')
          done()
        })
    });
  })

  describe('.loadState()', function (){
    it('should retrieve stored state', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      const mockedGet = oidc.stateStore.get =jest.fn( async ( state ) => {
        if(state === 'exist'){
          return true
        }
        return false
      })
      // @ts-expect-error
      const mockedDel = oidc.stateStore.del = jest.fn( async ( state ) => {
        if(state === 'exist'){
          return true
        }
        return false
      })

      // @ts-expect-error
      oidc.loadState('exist').then((storedState)=>{
        expect(mockedGet).toBeCalled()
        expect(mockedDel).toBeCalled()
        done()
      }).catch(done.fail)
    });

    it('should fail if state does not exist', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      const mockedGet = oidc.stateStore.get =jest.fn( async ( state ) => {
        if(state === 'exist'){
          return true
        }
        return false
      })

      // @ts-expect-error
      oidc.loadState('notExists').then(done.fail).catch( (err)=>{
        expect(mockedGet).toBeCalled()
        expect(err).toBeInstanceOf(AuthenticationError)
        expect(err.message).toBe('State not found')
        done()
      })
    });
  })

  describe('.handleAuthResponse()', function () {
    it('should handle', function (done) {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.handleAuthResponse({ param: 'value'}, {}, {})
        .then( resp => {
          expect(resp).toStrictEqual({ param: 'value'})
          done()
        }).catch(done.fail)
    });

    it('should exchange code', function (done) {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.exchangeAuthorizationCode = jest.fn(async () => ({ }))
      // @ts-expect-error
      oidc.handleAuthResponse({ code: 'code'}, {}, {})
        .then( resp => {
          // @ts-expect-error
          expect(oidc.exchangeAuthorizationCode).toBeCalled()
          done()
        }).catch(done.fail)
    });
  })

  describe('.handleTokenResult()', function (){
    let mockedValidator: jest.Mock<any, any>;
    beforeAll(() =>{
      mockedValidator = jest.fn().mockReturnValue(Promise.resolve({
        nonce: 'nonUserClaim',
        first_name: 'first'
      }));
      // @ts-ignore
      joseUtils.validateIdToken = mockedValidator
    })

    afterEach(() => mockedValidator.mockClear())
    afterAll(() => mockedValidator.mockRestore())

    it('should handle', function (done) {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.handleTokenResult({}, {}, {})
        .then( resp => {
          expect(resp).toStrictEqual({ authParams: {}, scope: undefined, user: {} })
          done()
        }).catch(done.fail)
    });

    it('should handle "id_token"', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.handleTokenResult({id_token: 'test'}, {}, {})
        .then( resp => {
          expect(mockedValidator).toBeCalled()
          expect(resp).toStrictEqual({ authParams: {},
              "id_token": "test",
              scope: undefined,
              user: {
                first_name: 'first'
              }
            }
          )
          done()
        }).catch(done.fail)
    });

    it('should call custom "idTokenValidator"', function (done) {
      const customValidator = jest.fn( async () => Promise.resolve(false))
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.handleTokenResult({id_token: 'test'}, {}, {idTokenValidator: customValidator})
        .then(done.fail.bind(null, 'should not succeed'))
        .catch(err => {
          expect(mockedValidator).toBeCalled()
          expect(customValidator).toBeCalled()
          expect(err).toBeInstanceOf(InvalidIdTokenError)
          expect(err.message).toBe('Id Token validation failed')
          done()
        })
    });
    it('should handle "access_token"', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      oidc.handleTokenResult({access_token: 'test'}, {}, {})
        .then( resp => {
          expect(resp).toStrictEqual({
              authParams: {},
              access_token: "test",
              scope: undefined,
              user: {}
            }
          )
          done()
        }).catch(done.fail)
    });

    it('should fetch user info when "requestUserInfo" = true', function (done) {
      const oidc = new OIDCClient({...dummyOpts, endpoints: {
          userinfo_endpoint: 'user_info_endpoint'
        }})
      // @ts-expect-error
      oidc.fetchUserInfo = jest.fn().mockReturnValue({ sub: 'test'})
      // @ts-expect-error
      oidc.handleTokenResult({access_token: 'dummyToken'}, {}, {
        requestUserInfo: true
      })
        .then( resp => {
          // @ts-expect-error
          expect(oidc.fetchUserInfo).toBeCalledWith('dummyToken')
          expect(resp).toStrictEqual({
              authParams: {},
              access_token: "dummyToken",
              scope: undefined,
              user: { sub: 'test' }
            }
          )
          done()
        }).catch(done.fail)
    });
  })

  describe('.login()', function () {
    beforeAll(() => {
      // @ts-ignore
      delete window.location
      // @ts-ignore
      window.location = {assign : jest.fn()}
      jest.spyOn(window.location, 'assign')
    })
    it('should navigate the window to auth request', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      oidc.login().then(function () {
        expect(window.location.assign).toBeCalled()
        done()
      })
    });
  })

  describe('.loginWithPopup()', function () {
    it('should execute popup and handle auth result', function (done) {
      const mockedRunPopup = jest.fn( async () => {
        return { response: { state: 'test' }, state: { authParams: {}, localState: {}}}
      })
      // @ts-expect-error
      popupUtils["runPopup"] = mockedRunPopup
      const oidc = new OIDCClient(dummyOpts)

      const authResult = { user: 'x'}

      // @ts-ignore
      oidc.exchangeAuthorizationCode = jest.fn(async () => ({ }))
      // @ts-ignore
      oidc.handleTokenResult = jest.fn(async () => authResult)

      const onLogin = jest.fn()
      oidc.on(Events.USER_LOGIN, onLogin )
      oidc.loginWithPopup().then(function () {
        expect(mockedRunPopup).toBeCalled()
        expect(onLogin).toBeCalledWith(authResult)
        done()
      })
    });

  })

  describe('.monitorSession()', function () {
    const originalFn = checkSessionUtils["createSessionCheckerFrame"]
    const mockedChecker = jest.fn(  () => {
      return { start: mockedStart, stop: mockedStop }
    })
    const mockedStart = jest.fn()
    const mockedStop= jest.fn()
    const oidcOpts = {
      ...dummyOpts,
      endpoints: {
        check_session_iframe: "http://example.com/example"
      }
    }
    beforeEach( () => {

      // @ts-expect-error
      checkSessionUtils["createSessionCheckerFrame"] = mockedChecker
    })
    afterEach(()=>{
      // @ts-expect-error
      checkSessionUtils["createSessionCheckerFrame"] = originalFn
    })


    it('should not run if "check_session_iframe" not exists', function () {
      const oidc = new OIDCClient(dummyOpts)
      jest.spyOn(console, 'warn')

      // @ts-expect-error
      oidc.monitorSession({})
      expect(console.warn).toBeCalledWith('"check_session_iframe" endpoint missing or session management is not supported by provider')
    });

    it('should should create session checker if not exists', function () {
      const oidc = new OIDCClient(oidcOpts)

      const session_state = 'state'
      // @ts-expect-error
      oidc.monitorSession({sub: 's', session_state})

      expect(checkSessionUtils["createSessionCheckerFrame"]).toBeCalled()
      expect(mockedStart).toBeCalledWith(session_state)
    });
  })

  describe('.loginCallback()', function () {

    it('should fail if no url is passed', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      const oldWindow = window.location;
      // @ts-ignore
      delete window.location;
      oidc.loginCallback().catch( e => {
        expect(e).toBeInstanceOf(OIDCClientError)
        expect(e.message).toBe('Url must be passed to handle login redirect')
        done()
      })
      window.location = oldWindow
    });
    it('should fail if wrong url is passed', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      oidc.loginCallback('wrongUrlformat#asdasdasd').catch( e => {
        expect(e).toBeInstanceOf(OIDCClientError)
        expect(e.message).toBe('Invalid callback url passed: "wrongUrlformat#asdasdasd"')
        done()
      })
    });

    it('should exchange auth code ', function (done) {
      const authObj = { user: { sub: 'test'}}

      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.loadState = jest.fn(async () => ({ authParams:{}, localState:{}, request_type: 'd' }))
      // @ts-expect-error
      oidc.exchangeAuthorizationCode = jest.fn()
      // @ts-expect-error
      oidc.handleTokenResult = jest.fn( async () => authObj)

      const onLogin = jest.fn()
      oidc.on(Events.USER_LOGIN, onLogin )

      oidc.loginCallback('http://example.com?code=1q2w3e4r&state=123456')
        .then(()=>{
          // @ts-expect-error
          expect(oidc.loadState).toBeCalledWith('123456')
          expect(onLogin).toBeCalledWith(authObj)
          done()
        })
    });
    it('should fail if auth request failed', function (done) {
      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.loadState = jest.fn(async () => ({ authParams:{}, localState:{}, request_type: 'd' }))

      oidc.loginCallback('http://example.com?error=auth_error&error_description=failed&state=123456')
        .catch((e)=>{
          // @ts-expect-error
          expect(oidc.loadState).toBeCalledWith('123456')
          expect(e).toBeInstanceOf(AuthenticationError)
          done()
        })
    });

    it('should notify parent if it is called from embedded document', function (done) {
      Object.defineProperty(window, 'frameElement', {
        value: '123'
      });

      const oidc = new OIDCClient(dummyOpts)

      // @ts-expect-error
      oidc.loadState = jest.fn(async () => ({ authParams:{}, localState:{}, request_type: 's' }))

      window.parent.postMessage = jest.fn()
      oidc.loginCallback('http://example.com?code=1q2w3e4r&state=123456')
        .then(()=>{
          // @ts-expect-error
          expect(oidc.loadState).toBeCalledWith('123456')
          expect(window.parent.postMessage).toBeCalledWith({
            type:     'authorization_response',
            response: { code: '1q2w3e4r', state: '123456'},
            state: { authParams:{}, localState:{}, request_type: 's' }
          }, window.location.protocol + "//" + window.location.host)
          done()
        })
    });

    it('should notify parent if it is called from popup', function (done) {
      Object.defineProperty(window, 'opener', {
        value: {}
      });

      const oidc = new OIDCClient(dummyOpts)

      const state = { authParams:{}, localState:{}, request_type: 'p' }
      // @ts-expect-error
      oidc.loadState = jest.fn(async () => state)

      window.opener.postMessage = jest.fn()
      oidc.loginCallback('http://example.com?code=1q2w3e4r&state=123456')
        .then(()=>{
          // @ts-expect-error
          expect(oidc.loadState).toBeCalledWith('123456')
          expect(window.opener.postMessage).toBeCalledWith({
            type:     'authorization_response',
            response: { code: '1q2w3e4r', state: '123456'},
            state
          }, window.location.protocol + "//" + window.location.host)
          done()
        })
    });
  })

  describe('.silentLogin()', function () {

    it('should use refresh_token if there is one', function (done) {
      const oidc = new OIDCClient({...dummyOpts, useRefreshToken: true})

      const authObj = { user: { sub: 'test'}}
      // @ts-expect-error
      oidc.exchangeRefreshToken = jest.fn()
      // @ts-expect-error
      oidc.handleTokenResult = jest.fn( async () => authObj)
      // @ts-expect-error
      oidc.authStore.set('auth', { refresh_token: 'dummyToken'})


      const onLogin = jest.fn()
      oidc.on(Events.USER_LOGIN, onLogin )
      oidc.silentLogin().then(function () {
        // @ts-expect-error
        expect(oidc.exchangeRefreshToken).toBeCalled()
        // @ts-expect-error
        expect(oidc.handleTokenResult).toBeCalled()
        expect(onLogin).toBeCalledWith(authObj)
        done()
      })
    });

    it('should use silent_redirect_uri as redirect_uri if passed', function (done) {
      const mockedRunIFrame = jest.fn( async () => {
        return { response: { state: 'test' }, state: {} }
      })
      // @ts-expect-error
      iframeUtils["runIframe"] = mockedRunIFrame
      const oidc = new OIDCClient({...dummyOpts, silent_redirect_uri: 'silent_redirect_uri', redirect_uri: 'redirect_uri'})

      const authObj = { user: { sub: 'test'}}
      // @ts-expect-error
      oidc.createAuthRequest = jest.fn( (opts) => {
        expect(opts!.redirect_uri).toBe('silent_redirect_uri')
        return
      })
      // @ts-expect-error
      oidc.exchangeRefreshToken = jest.fn()
      // @ts-expect-error
      oidc.handleTokenResult = jest.fn( async () => authObj)

      // @ts-expect-error
      oidc.authStore.set('auth', { })

      const onLogin = jest.fn()
      oidc.on(Events.USER_LOGIN, onLogin )
      oidc.silentLogin().then(function () {
        // @ts-expect-error
        expect(oidc.createAuthRequest).toBeCalled()
        // @ts-expect-error
        expect(oidc.handleTokenResult).toBeCalled()
        expect(onLogin).toBeCalledWith(authObj)
        done()
      }).catch(done.fail)
    });


    it('should make auth request if refresh tokens are not used', function (done) {

      const mockedRunIFrame = jest.fn( async () => {
        return { response: { state: 'test' }, state: {} }
      })
      // @ts-expect-error
      iframeUtils["runIframe"] = mockedRunIFrame

      const oidc = new OIDCClient(dummyOpts)

      const authObj = { user: { sub: 'test'}}
      // @ts-expect-error
      oidc.createAuthRequest = jest.fn()
      // @ts-expect-error
      oidc.handleAuthResponse = jest.fn()
      // @ts-expect-error
      oidc.exchangeAuthorizationCode = jest.fn()
      // @ts-expect-error
      oidc.handleTokenResult = jest.fn( async () => authObj)
      // @ts-expect-error
      oidc.authStore.set('auth', { })


      const onLogin = jest.fn()
      oidc.on(Events.USER_LOGIN, onLogin )
      oidc.silentLogin().then(function () {
        // @ts-expect-error
        expect(oidc.handleAuthResponse).toBeCalled()
        // @ts-expect-error
        expect(oidc.handleTokenResult).toBeCalled()
        expect(onLogin).toBeCalledWith(authObj)
        done()
      })
    });

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

  describe('.logout()', function () {
    const oldLocation = window.location
    beforeEach(() => {
      // @ts-ignore
      delete window.location
      // @ts-ignore
      window.location = {assign : jest.fn()}
      jest.spyOn(window.location, 'assign')
    })
    afterEach( () => {
      window.location = oldLocation
    })

    it('should redirect window to logout uri', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      oidc.logout().then(function () {
        expect(window.location.assign).toBeCalled()
        done()
      })
    });

    it('should clear only from local if "localOnly" = true', function (done) {
      const oidc = new OIDCClient(dummyOpts)
      // @ts-expect-error
      jest.spyOn(oidc.authStore, "clear")

      oidc.logout({localOnly: true}).then(function () {
        // @ts-expect-error
        expect(oidc.authStore.clear).toBeCalled()
        expect(window.location.assign).not.toBeCalled()
        done()
      })
    });
  })
})
