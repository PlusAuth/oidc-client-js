import { createLeaderElection, BroadcastChannel } from 'broadcast-channel';

import { LeaderElector } from 'broadcast-channel/types/leader-election';

import { Events, EventTypes } from './constants';

import {
  AuthenticationError, InvalidIdTokenError,
  PAError
} from './errors';

import { EventEmitter } from './helpers';
import {
  InMemoryStateStore,
  LocalStorageStateStore,
  StateStore,
} from './helpers/state_manager';



import { Timer } from './helpers/timer';
import {
  AuthRequestOptions, IEndpointConfiguration,
  IPlusAuthClientOptions,
  LogoutRequestOptions, PopupOptions, RevokeOptions, SessionChecker,
  SessionMonitorOptions,
  TokenRequestOption, TokenResponse, TokenType
} from './interfaces';

import {
  RequestOptions,
  request,
  runIframe,
  buildEncodedQueryString,
  parseQueryUrl,
  validateIdToken,
  createSessionCheckerFrame,
  nonUserClaims, generateRandom, deriveChallenge, isValidOrigin,
} from './utils';

import { isResponseType, isScopeIncluded } from './utils/oidc';
import { runPopup } from './utils/popup';

/**
 * `OIDCClient` provides methods for interacting with OIDC/OAuth2 authorization server. Those methods are signing a
 * user in, signing out, managing the user's claims, checking session and managing tokens returned from the
 * OIDC/OAuth2 provider.
 *
 */
export class OIDCClient extends EventEmitter<EventTypes>{
  options: IPlusAuthClientOptions

  user?: any;

  scopes?: string[];

  accessToken?: string;

  refreshToken?: string;

  idToken?: string;

  issuer_metadata?: Record<string, any>;

  private readonly http: ( options: RequestOptions ) => Promise<any>;

  private stateStore: StateStore

  private authStore: StateStore;

  private sessionCheckerFrame?: SessionChecker

  private _accessTokenExpireTimer?: Timer;

  private leaderElector: LeaderElector

  private initialized!: boolean;

  private __initializePromise!: Promise<any>;

  constructor( options: IPlusAuthClientOptions ) {
    super()
    if ( !isValidOrigin( options.issuer ) ){
      throw new PAError( '"issuer" must be a valid uri.' )
    }

    this.options = Object.assign( {
      secondsToRefreshAccessTokenBeforeExp: 60,
      autoSilentRenew:                      true,
      checkSession:                         true,
    }, options, {
      // remove last slash for consistency across the lib
      issuer: options.issuer.endsWith( '/' ) ? options.issuer.slice( 0, -1 ) : options.issuer
    } )

    this.http = this.options.httpClient || request
    this.stateStore = this.options.stateStore || new LocalStorageStateStore( 'pa_oidc.state.' )
    this.authStore = this.options.authStore || new InMemoryStateStore()
    // TODO: use another solution to decrease bundle size
    this.leaderElector = createLeaderElection( new BroadcastChannel( 'pa_oidc_client', {
      webWorkerSupport: false
    } ), {} )


    if ( this.options.autoSilentRenew ){
      this._accessTokenExpireTimer = new Timer()
    }

    this.on( Events.USER_LOGOUT, async ()=>{
      this.user = undefined
      this.scopes = undefined;
      this.accessToken = undefined
      this.idToken = undefined
      this.refreshToken = undefined
      await this.authStore.clear()
    } )

    this.on( Events.USER_LOGIN, async ( authObj ) => {
      const { expires_in, user, scope, access_token, id_token, refresh_token, session_state } = authObj
      await this.authStore.set( 'auth', authObj )

      this.user = user
      this.scopes = scope?.split( ' ' );
      this.accessToken = access_token
      this.idToken = id_token
      this.refreshToken = refresh_token
      if ( !window?.frameElement ) {
        if ( this.options.checkSession ) {
          this.monitorSession( { sub: user.sub || user.id, session_state } )
        }

        if ( expires_in !== undefined && this.options.autoSilentRenew ){
          const expiration = Number( expires_in ) - this.options.secondsToRefreshAccessTokenBeforeExp!
          if ( expiration >= 0 ){
            this._accessTokenExpireTimer!.start( expiration, async ()=> {
              await this.leaderElector.awaitLeadership()
              try {
                await this.silentLogin()
                this.emit( Events.SILENT_RENEW_SUCCESS, null )
              } catch ( e ) {
                this.emit( Events.SILENT_RENEW_ERROR, e )
              }
            } )
          }
        }
      }
    } )
  }

  /**
   * Initialize the library with this method. It resolves issuer configuration, jwks keys which are necessary for
   * validating tokens returned from provider and checking if a user is already authenticated in provider.
   *
   * @param checkLogin Make this `false` if you don't want to check user authorization status in provider while
   * initializing. Defaults to `true`
   */
  async initialize( checkLogin = true ): Promise<OIDCClient>{
    if ( this.initialized ){
      return this
    }

    if ( this.__initializePromise ){
      await this.__initializePromise
    } else {
      this.__initializePromise = new Promise( async ( resolve ) => {
        if ( this.stateStore.init ){
          await this.stateStore.init()
        }
        if ( this.authStore.init ){
          await this.authStore.init()
        }

        if ( !this.options.endpoints ){
          this.issuer_metadata = await this.fetchFromIssuer()
          this.options.endpoints = {} as any
          for ( const prop of Object.keys( this.issuer_metadata! ) ) {
            if ( prop.endsWith( '_endpoint' ) || prop.indexOf( '_session' ) !== -1 || prop.indexOf( '_uri' ) !== -1 ) {
              this.options.endpoints![prop as keyof IEndpointConfiguration] = this.issuer_metadata![prop];
            }
          }
        }
        this.initialized = true
        resolve( this )
      } )
    }

    if ( checkLogin ){
      try {
        if ( !window?.frameElement ){
          await this.silentLogin()
        }
      } catch ( e ) {
        await this.authStore.clear()
      }
    }

    return this.__initializePromise
  }

  /**
   * Redirect to provider's authorization endpoint using provided parameters. You can override any parameter defined
   * in `OIDCClient`. If you don't provide `state`, `nonce` or `code_verifier` they will be generated automatically
   * in a random and secure way.
   *
   * @param options
   * @param localState
   */
  async login( options: Partial<AuthRequestOptions> = {}, localState: Record<string, any> = {} ){
    window.location.assign( await this.createAuthRequest( options, localState ) )
  }

  /**
   * Open a popup with the provider's authorization endpoint using provided parameters. You can override any
   * parameter defined in `OIDCClient`. If you don't provide `state`, `nonce` or `code_verifier` they will be
   * generated automatically in a random and secure way. You can also override popup options.
   *
   * NOTE: Most browsers block popups if they are not happened as a result of user actions. In order to display
   * login popup you must call this method in an event handler listening for a user action like button click.
   *
   * @param options
   * @param popupOptions
   */
  async loginWithPopup( options: Partial<AuthRequestOptions> = {}, popupOptions: PopupOptions = {} ){
    const url = await this.createAuthRequest( {
      ...options,
      response_mode: 'web_message',
      display:       'popup',
      request_type:  'p'
    } )
    const { response, state } = await runPopup( url, popupOptions )
    const { authParams, localState } = state
    const tokenResult = await this.handleAuthResponse( response, authParams, localState )
    const authObject = await this.handleTokenResult(
      tokenResult,
      authParams,
      Object.assign( {}, this.options, authParams )
    )
    authObject.session_state= response.session_state;
    this.emit( Events.USER_LOGIN, authObject )
    return localState
  }

  /**
   * After a user successfully authorizes an application, the authorization server will redirect the user back to
   * the application with either an authorization code or access token in the URL. In the callback page you should
   * call this method.
   *
   * @param url Full url which contains authorization request result parameters. Defaults to `window.location.href`
   */
  async loginCallback( url: string= window?.location?.href ){
    if ( !url ){
      return Promise.reject( new PAError( 'Url must be passed to handle login redirect' ) )
    }
    let parsedUrl = null
    try {
      parsedUrl = new URL( url )
    } catch ( e ){
      return Promise.reject( new PAError( `Invalid callback url passed: "${ url }"` ) )
    }

    const responseParams = parseQueryUrl( parsedUrl?.search || parsedUrl?.hash )
    const rawStoredState = await this.loadState( responseParams.state )
    const { authParams, localState, request_type } = rawStoredState
    url = url || window.location.href;
    switch ( request_type ) {
      case 's':
        if ( window?.frameElement ) {
          if ( url ) {
            window.parent.postMessage( {
              type:     'authorization_response',
              response: responseParams,
              state:    rawStoredState
            }, `${ location.protocol }//${ location.host }` );
          }
        }
        return
      case 'p':
        if ( window.opener && url ){
          window.opener.postMessage( {
            type:     'authorization_response',
            response: responseParams,
            state:    rawStoredState
          }, `${ location.protocol }//${ location.host }` );
        }
        return
      default:
        if ( responseParams.error ){
          return Promise.reject( new AuthenticationError( responseParams.error, responseParams.error_description ) )
        }
        const tokenResult = await this.handleAuthResponse( responseParams, authParams, localState )
        const authObject = await this.handleTokenResult(
          tokenResult,
          authParams,
          Object.assign( {}, this.options, authParams )
        )
        authObject.session_state= responseParams.session_state;
        this.emit( Events.USER_LOGIN, authObject )
        return localState
    }
  }

  /**
   * Redirect to provider's `end_session_endpoint` with provided parameters. After logout provider will redirect to
   * provided `post_logout_redirect_uri` if it provided.
   * @param options
   */
  async logout( options: LogoutRequestOptions = {} ){
    if ( !options.localOnly ) {
      const storedAuth = await this.authStore.get( 'auth' )
      const id_token_hint = options.id_token_hint || storedAuth?.id_token
      window.location.assign( this.createLogoutRequest( {
        ...options,
        id_token_hint
      } ) )
    }
    await this.authStore.clear()
  }

  /**
   * OAuth2 token revocation implementation method. See more at [tools.ietf.org/html/rfc7009](https://tools.ietf.org/html/rfc7009)
   * @param token Token to be revoked
   * @param type Passed token's type. It will be used to provide `token_type_hint` parameter.
   * @param options If necessary override options passed to `OIDCClient` by defining them here.
   */
  async revokeToken( token: string, type: TokenType = 'access_token', options: RevokeOptions = {} ){
    if ( !this.options.endpoints!.revocation_endpoint ){
      return Promise.reject( new PAError( '"revocation_endpoint" doesn\'t exist' ) )
    }
    const finalOptions = {
      client_id:       options.client_id || this.options.client_id,
      client_secret:   options.client_secret || this.options.client_secret,
      token_type_hint: type,
      token:           token
    }

    return this.http( {
      method:      'POST',
      requestType: 'form',
      url:         this.options.endpoints!.revocation_endpoint,
      body:        finalOptions
    } )
  }

  /**
   * Login without having an interaction. If refresh tokens are used and there is a stored refresh token it will
   * exchange refresh token to receive new access token. If not it silently makes a request the provider's
   * authorization endpoint using provided parameters. You can override any parameter defined in `OIDCClient`. If
   * you don't provide `state`, `nonce` or `code_verifier` they will be generated automatically in a random and
   * secure way.
   *
   * @param options
   * @param localState
   */
  async silentLogin( options: AuthRequestOptions = {}, localState: Record<string, any> = {} ){
    console.log( 'silent login called' )
    await this.initialize( false )
    let tokenResult: any;
    let finalState: any = {}

    const storedAuth = await this.authStore.get( 'auth' ) || {}

    const finalOptions = Object.assign( {}, this.options, options )

    if ( finalOptions.silent_redirect_uri ){
      finalOptions.redirect_uri = finalOptions.silent_redirect_uri
    }

    if ( this.options.useRefreshToken && storedAuth?.refresh_token ){
      tokenResult = await this.exchangeRefreshToken( {
        ...finalOptions,
        refresh_token: storedAuth.refresh_token,
      } )
    } else {
      const authUrl = await this.createAuthRequest( {
        ...finalOptions,
        display:       'page',
        response_mode: 'query',
        prompt:        finalOptions.prompt || 'none',
        request_type:  's'
      }, localState )

      const { response, state } = await runIframe( authUrl, { eventOrigin: window.location.origin } )
      tokenResult = await this.handleAuthResponse( response, finalOptions, localState )
      storedAuth.session_state = response.session_state;
      finalState = state
    }

    const authObject = await this.handleTokenResult( tokenResult, finalState.authParams, finalOptions )
    authObject.session_state = storedAuth.session_state
    this.emit( Events.USER_LOGIN, authObject )
    return finalState.localState
  }

  /**
   * Retrieve logged in user's access token if it exists.
   */
  async getAccessToken(){
    return ( await this.authStore.get( 'auth' ) )?.access_token
  }


  /**
   * Retrieve logged in user's refresh token if it exists.
   */
  async getRefreshToken(){
    return ( await this.authStore.get( 'auth' ) )?.refresh_token
  }

  /**
   * Retrieve logged in user's id token if it exists.
   */
  async getIdToken(){
    return ( await this.authStore.get( 'auth' ) )?.id_token
  }


  /**
   * Retrieve logged in user's scopes if it exists.
   */
  async getScopes(){
    return ( await this.authStore.get( 'auth' ) )?.scope?.split( ' ' )
  }


  /**
   * Retrieve logged in user's profile.
   */
  async getUser(){
    return ( await this.authStore.get( 'auth' ) )?.user
  }

  /**
   * If there is a user stored locally return true. Otherwise it will make a silentLogin to check if End-User is
   * logged in provider.
   *
   * @param localOnly Don't check provider
   */
  async isLoggedIn( localOnly = false ){
    const existsOnLocal = !!await this.getUser()
    if ( !existsOnLocal && !localOnly ){
      try {
        await this.silentLogin()
        return true
      } catch ( e ){
        return false
      }
    }
    return existsOnLocal
  }

  /**
   * Create authorization request with provided options.
   *
   * @param options
   * @param localState
   * @private
   */
  private async createAuthRequest( options: Partial<AuthRequestOptions> = {},
    localState: Record<string, any> = {} ): Promise<string>{
    // TODO: deep merge for extra params
    const finalOptions = Object.assign( {}, this.options, options )
    localState.code_verifier = generateRandom( 72 )


    const authParams: Record<string, string | undefined> = {
      client_id:          finalOptions.client_id,
      state:              generateRandom( 10 ),
      scope:              finalOptions.scope,
      audience:           finalOptions.audience,
      redirect_uri:       finalOptions.redirect_uri,
      response_type:      finalOptions.response_type || 'code',
      ui_locales:         finalOptions.ui_locales,
      prompt:             finalOptions.prompt,
      display:            finalOptions.display,
      claims_locales:     finalOptions.claims_locales,
      acr_values:         finalOptions.acr_values,
      registration:       finalOptions.registration,
      login_hint:         finalOptions.login_hint,
      id_token_hint:      finalOptions.id_token_hint,
      web_message_uri:    finalOptions.web_message_uri,
      web_message_target: finalOptions.web_message_target,
      ...finalOptions.extraParams && finalOptions.extraParams
    };

    if ( isResponseType( 'id_token', authParams.response_type ) ||
      isScopeIncluded( 'openid', authParams.scope ) ){
      authParams.nonce = generateRandom( 10 )
    }

    if ( isResponseType( 'code', authParams.response_type ) ){
      authParams.code_challenge= await deriveChallenge( localState.code_verifier )
      authParams.code_challenge_method= finalOptions.code_challenge_method || 'S256'
    }

    const now = this.options.currentTimeInMillis && this.options.currentTimeInMillis() || Date.now()
    const fragment = finalOptions.fragment ? `#${ finalOptions.fragment }` : '';
    const authParamsString = buildEncodedQueryString( authParams )
    const url = `${ this.options.endpoints!.authorization_endpoint }${ authParamsString }${ fragment }`

    // clear 1 day old state entries
    this.stateStore.clear( now - 86400000 )


    await this.stateStore.set( authParams.state!, {
      created_at:   now,
      authParams,
      localState,
      request_type: finalOptions.request_type
    } )
    return url
  }

  /**
   * Create a logout request with given options
   *
   * @param options
   * @private
   */
  private createLogoutRequest( options: LogoutRequestOptions = {} ){
    const finalOptions = Object.assign( {}, this.options, options )
    const logoutParams = {
      id_token_hint:            finalOptions.id_token_hint,
      post_logout_redirect_uri: finalOptions.post_logout_redirect_uri,
      ...finalOptions.extraLogoutParams && finalOptions.extraLogoutParams
    }
    return `${ this.options.endpoints!.end_session_endpoint }${ buildEncodedQueryString( logoutParams ) }`
  }

  /**
   * Exchange authorization code retrieved from auth request result.
   * @param options
   * @private
   */
  private async exchangeAuthorizationCode( options: TokenRequestOption ){
    const extraTokenHeaders = options.extraTokenHeaders
    options = Object.assign( {}, options, options.extraTokenParams || {} );

    delete options.extraTokenParams
    delete options.extraTokenHeaders

    options.grant_type = options.grant_type || 'authorization_code';
    options.client_id = options.client_id || this.options.client_id;
    options.redirect_uri = options.redirect_uri || this.options.redirect_uri;

    if ( !options.code ) {
      return Promise.reject( new Error( '"code" is required' ) );
    }
    if ( !options.redirect_uri ) {
      return Promise.reject( new Error( '"redirect_uri" is required' ) );
    }
    if ( !options.code_verifier ) {
      return Promise.reject( new Error( '"code_verifier" is required' ) );
    }
    if ( !options.client_id ) {
      return Promise.reject( new Error( '"client_id" is required' ) );
    }

    return this.http( {
      url:         `${ this.options.endpoints!.token_endpoint }`,
      method:      'POST',
      requestType: 'form',
      body:        options as any,
      headers:     extraTokenHeaders
    } )
  }

  /**
   * Exchange refresh token with given options
   * @param options
   * @private
   */
  private async exchangeRefreshToken( options: Partial<TokenRequestOption> ) {
    const extraTokenHeaders = options.extraTokenHeaders
    options = Object.assign( {}, options, options.extraTokenParams || {} );

    options.grant_type = options.grant_type || 'refresh_token';
    options.client_id = options.client_id || this.options.client_id;
    options.client_secret = options.client_secret || this.options.client_secret;

    if ( !options.refresh_token ) {
      return Promise.reject( new Error( '"refresh_token" is required' ) );
    }
    if ( !options.client_id ) {
      return Promise.reject( new Error( '"client_id" is required' ) );
    }

    return this.http( {
      url:         `${ this.options.endpoints!.token_endpoint }`,
      method:      'POST',
      requestType: 'form',
      body:        options as any,
      headers:     extraTokenHeaders
    } );
  }

  /**
   * Fetch OIDC configuration from the issuer.
   */
  private async fetchFromIssuer(){
    const requestUrl = `${ this.options.issuer }/.well-known/openid-configuration`
    return this.http( {
      url:         requestUrl,
      method:      'GET',
      requestType: 'json'
    } )
  }

  /**
   * Handle auth request result. If there is `code` exchange it.
   * @param response
   * @param finalOptions
   * @param localState
   * @private
   */
  private async handleAuthResponse( response: any, finalOptions: IPlusAuthClientOptions,
    localState: Record<string, any> = {} ){
    if ( response.code ){
      return this.exchangeAuthorizationCode( {
        redirect_uri:  finalOptions.redirect_uri,
        client_id:     finalOptions.client_id,
        code_verifier: localState.code_verifier,
        grant_type:    'authorization_code',
        code:          response.code,
      } );
    } else {
      return response
    }
  }

  /**
   * Handle OAuth2 auth request result
   * @param tokenResult
   * @param authParams
   * @param finalOptions
   * @private
   */
  private async handleTokenResult( tokenResult: TokenResponse, authParams: AuthRequestOptions,
    finalOptions: IPlusAuthClientOptions ){
    await this.initialize( false )
    let user: any = {}
    if ( tokenResult.id_token ){
      const payload = await validateIdToken( tokenResult.id_token, authParams.nonce!, finalOptions )
      if ( finalOptions.idTokenValidator && !await finalOptions.idTokenValidator( tokenResult.id_token ) ){
        return Promise.reject( new InvalidIdTokenError( 'Id Token validation failed' ) )
      }
      Object.keys( payload ).forEach( key => {
        if ( !nonUserClaims.includes( key as any ) ){
          // @ts-ignore
          user[key] = payload[key]
        }
      } )
    }

    if ( tokenResult.access_token ) {
      if ( finalOptions.requestUserInfo && this.options.endpoints?.userinfo_endpoint ) {
        const userInfoResult = await this.fetchUserInfo( tokenResult.access_token )
        user = { ...user, ...userInfoResult }
      }
    }

    return {
      authParams,
      user,
      ...tokenResult,
      scope: tokenResult.scope || authParams.scope,
    }
  }

  /**
   * Load stored state
   *
   * @param state
   * @private
   */
  private async loadState( state: string ){
    const rawStoredState = await this.stateStore.get( state )
    if ( !rawStoredState ){
      return Promise.reject( new AuthenticationError( 'State not found' ) )
    } else {
      await this.stateStore.del( state )
    }
    return rawStoredState
  }

  /**
   * Load user info by making request to providers `userinfo_endpoint`
   *
   * @param accessToken
   * @private
   */
  private async fetchUserInfo( accessToken: string ){
    return this.http( {
      method:      'GET',
      url:         `${ this.options.endpoints!.userinfo_endpoint }`,
      requestType: 'json',
      headers:     {
        'Authorization': `Bearer ${ accessToken }`
      }
    } )
  }

  /**
   * Start monitoring End-User's session if the OIDC provider supports session management. See more at [OIDC Session
   * Management](https://openid.net/specs/openid-connect-session-1_0.html)
   *
   * @param sub End-User's id to for monitoring session
   * @param session_state string that represents the End-User's login state at the OP
   */
  private monitorSession( { sub, session_state }: SessionMonitorOptions ){
    const { client_id, endpoints } = this.options

    if ( !endpoints?.check_session_iframe ){
      console.warn( '"check_session_iframe" endpoint missing or session management is not supported by provider' )
      return
    }

    if ( !this.sessionCheckerFrame ){
      const sessionCheckCallback = async ( err: any )=>{
        if ( err ){
          this.emit( Events.SESSION_ERROR, err )
        } else {
          this.emit( Events.SESSION_CHANGE )
          try {
            await this.silentLogin( {}, {} )
            const storedAuth = await this.authStore.get( 'auth' )
            if ( storedAuth ){
              if ( storedAuth?.user.sub === sub ){
                this.sessionCheckerFrame!.start( storedAuth.session_state )
              }
            } else {
              this.emit( Events.USER_LOGOUT, null )
            }
          } catch ( e ) {
            this.emit( Events.SILENT_RENEW_ERROR, e )
            return
          }
        }
      }

      this.sessionCheckerFrame = createSessionCheckerFrame( {
        url:       endpoints.check_session_iframe,
        client_id: client_id,
        callback:  sessionCheckCallback
      } )
    }

    this.sessionCheckerFrame.start( session_state )
  }
}
