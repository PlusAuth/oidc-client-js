/*!
 * @plusauth/oidc-client-js v1.8.0
 * https://github.com/PlusAuth/oidc-client-js
 * (c) 2025 @plusauth/oidc-client-js Contributors
 * Released under the MIT License
 */
//#region src/constants/events.d.ts
declare const Events: {
  readonly USER_LOGOUT: "user_logout";
  readonly USER_LOGIN: "user_login";
  readonly SILENT_RENEW_SUCCESS: "silent_renew_success";
  readonly SILENT_RENEW_ERROR: "silent_renew_error";
  readonly SESSION_CHANGE: "session_change";
};
type EventTypes = "user_logout" | "user_login" | "silent_renew_success" | "silent_renew_error" | "session_change" | "session_error";
//#endregion
//#region src/helpers/event_emitter.d.ts
type Listener = (...args: any) => void;
declare class EventEmitter<T extends string> {
  callbacks: Record<string, any[]>;
  constructor();
  once(event: T, fn: (...args: any[]) => void): this;
  on(event: T, cb: (...args: any[]) => void): this;
  off(event?: T, fn?: (...args: any[]) => void): this;
  emit(event: T, ...args: any[]): this;
}
//#endregion
//#region src/helpers/state_manager/state_store.d.ts
interface StateStore<T = Record<string, any>> {
  init?(): Promise<StateStore<T>>;
}
declare abstract class StateStore<T = Record<string, any>> {
  prefix: string;
  constructor(prefix?: string);
  abstract get(key: string): Promise<T | null>;
  abstract set(key: string, value: T): Promise<void>;
  abstract del(key: string): Promise<void>;
  abstract clear(maxAge?: number): Promise<void>;
}
//#endregion
//#region src/helpers/state_manager/in_memory.d.ts
declare class InMemoryStateStore<T = any> extends StateStore<T> {
  map: Map<any, any>;
  clear(before?: number): Promise<void>;
  del(key: string): Promise<void>;
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
}
//#endregion
//#region src/helpers/state_manager/local_storage.d.ts
declare class LocalStorageStateStore<T = any> extends StateStore<T> {
  constructor(prefix?: string);
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
  clear(before?: number): Promise<void>;
}
//#endregion
//#region src/utils/iframe.d.ts
/**
 * Default HTML attributes applied to every hidden iframe created by
 * {@link createHiddenFrame} and used internally by {@link runIframe}.
 *
 * These attributes control accessibility and identification of the iframe
 * used during silent authentication and session-related operations.
 *
 * ## Customization
 * This object is **intentionally mutable** and acts as a global extension point.
 * Applications may modify or extend the attributes to adjust how the iframe is
 * rendered—for example, to add monitoring hooks, test selectors, or custom
 * accessibility attributes.
 *
 * Modifications must be applied **before** any iframe-related `OIDCClient`
 * methods are called (such as {@link OIDCClient.silentLogin}), because each
 * iframe is created using a snapshot of `DefaultIframeAttributes` at creation time.
 *
 * ### Example: Adding a custom attribute
 *
 * ```ts
 * import { DefaultIframeAttributes, OIDCClient } from "@plusauth/oidc-client-js";
 *
 * // Add a custom data attribute to all future hidden iframes
 * DefaultIframeAttributes["data-myapp"] = "example";
 *
 * const oidc = new OIDCClient({ ... });
 * await oidc.silentLogin();
 *
 * // The silent login iframe now includes: <iframe data-myapp="example" ...>
 * ```
 *
 * Typical use cases include:
 *  - Adding `data-*` attributes for debugging or testing
 *  - Adding custom accessibility metadata
 *  - Integrating with CSP / monitoring tools requiring tagged iframe elements
 *
 * @see createHiddenFrame
 * @see runIframe
 */
declare const DefaultIframeAttributes: Record<string, string>;
//#endregion
//#region src/utils/jose.d.ts
declare const nonUserClaims: readonly ["iss", "aud", "exp", "nbf", "iat", "jti", "azp", "nonce", "auth_time", "at_hash", "c_hash", "acr", "amr", "sub_jwk", "cnf", "sip_from_tag", "sip_date", "sip_callid", "sip_cseq_num", "sip_via_branch", "orig", "dest", "mky", "events", "toe", "txn", "rph", "sid", "vot", "vtm", "attest", "origid", "act", "scope", "client_id", "may_act", "jcard", "at_use_nbr"];
//#endregion
//#region src/utils/request.d.ts
interface RequestOptions {
  body?: Record<string, string | number | null | undefined>;
  headers?: Record<string, string>;
  method: "GET" | "POST" | "PATCH" | "TRACE" | "OPTIONS" | "HEAD";
  requestType?: "form" | "json";
  url: string;
}
//#endregion
//#region src/interfaces/index.d.ts
/**
 * Standard JOSE header fields used in JWT / JWS / JWE structures.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7515
 * @see https://www.rfc-editor.org/rfc/rfc7516
 */
type JWTHeaderField = "typ" | "cty" | "alg" | "zip" | "jku" | "jwk" | "kid" | "x5u" | "x5c" | "x5t" | "x5t#S256" | "crit" | "exp";
/**
 * Options used when creating an authorization request.
 * Most fields map directly to OpenID Connect or OAuth2 parameters.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 */
interface AuthRequestOptions {
  /** Requested Authentication Context Class Reference values. */
  acr_values?: string;
  /** Audience for which the client is requesting access. */
  audience?: string;
  /** Claims parameter requesting specific user attributes. */
  claims?: Record<string, any>;
  /** Preferred languages for user claims. */
  claims_locales?: string;
  /** OAuth2 client identifier. */
  client_id?: string;
  /** PKCE code challenge. */
  code_challenge?: string;
  /** PKCE code challenge method (typically `"S256"`). */
  code_challenge_method?: string;
  /** PKCE verifier used for exchanging authorization code. */
  code_verifier?: string;
  /** Display type: `page`, `popup`, etc. */
  display?: string;
  /** Additional parameters appended to the authorization request. */
  extraParams?: Record<string, any>;
  /** Optional URI fragment used by web_message or custom response handling. */
  fragment?: string;
  /** Id token hint for reauthentication scenarios. */
  id_token_hint?: string;
  /** Optional login hint such as email or username. */
  login_hint?: string;
  /** Generated nonce for replay protection. */
  nonce?: string;
  /** Prompt behavior: `none`, `login`, `consent`, etc. */
  prompt?: string;
  /** Redirect URI registered for the client. */
  redirect_uri?: string;
  /** Client registration parameter (rarely used). */
  registration?: string;
  /**
   * Internal request type:
   * - `"s"` → silent
   * - `"p"` → popup
   * - `"d"` → standard redirect
   */
  request_type?: "s" | "p" | "d";
  /** OAuth2/OIDC response mode such as `fragment`, `query`, `form_post`. */
  response_mode?: string;
  /** OAuth2/OIDC response type such as `code`, `token`, `id_token`. */
  response_type?: string;
  /** Requested scopes. */
  scope?: string;
  /** Client-generated state value used for request correlation. */
  state?: string;
  /** Preferred UI locales for login experience. */
  ui_locales?: string;
  /** Web Message response target (used in popup/iframe login). */
  web_message_target?: string;
  /** Web Message receiver URL. */
  web_message_uri?: string;
}
/**
 * Parameters required by the session monitor iframe.
 */
interface SessionMonitorOptions {
  /** Session state received from OP during authentication. */
  session_state: string;
  /** Subject identifier of the authenticated user. */
  sub: string;
}
/**
 * Options used when generating a logout request.
 */
interface LogoutRequestOptions {
  /** Additional provider-specific parameters for logout endpoint. */
  extraLogoutParams?: Record<string, string>;
  /** Original ID token issued during login (recommended for OpenID logout). */
  id_token_hint?: string;
  /** Do not redirect to OP for logout; clear local state only. */
  localOnly?: boolean;
  /** Redirect URL after logout completes. */
  post_logout_redirect_uri?: string;
}
/**
 * OpenID Provider metadata (discovery document).
 *
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
 */
interface IEndpointConfiguration {
  authorization_endpoint?: string;
  check_session_iframe?: string;
  device_authorization_endpoint?: string;
  end_session_endpoint?: string;
  introspection_endpoint?: string;
  jwks_uri?: string;
  mfa_endpoint?: string;
  registration_endpoint?: string;
  revocation_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
}
/**
 * Options used when instantiating the PlusAuth client.
 * Extends authorization and logout options with client-level configuration.
 */
interface IPlusAuthClientOptions extends Omit<AuthRequestOptions, "request_type">, Omit<LogoutRequestOptions, "localOnly"> {
  /**
   * Storage for authentication results (id_token, access_token, session_state …).
   * Defaults to `LocalStorageStateStore`.
   *
   * @see StateStore
   */
  authStore?: StateStore<any>;
  /**
   * Whether to automatically refresh access tokens before they expire
   * by triggering a silent login flow inside an iframe.
   *
   * @default true
   */
  autoSilentRenew?: boolean;
  /**
   * Enable or disable OpenID session monitoring.
   *
   * @default true
   */
  checkSession?: boolean;
  /**
   * How often to poll the session iframe (in ms).
   *
   * @default 2000
   */
  checkSessionInterval?: number;
  /** OAuth2 client identifier. */
  client_id: string;
  /** OAuth2 client secret (optional; required when using confidential flows). */
  client_secret?: string;
  /**
   * Allowed clock drift (in seconds) when validating tokens.
   */
  clockSkew?: number;
  /**
   * Custom function returning the current timestamp in milliseconds.
   * Useful when client clock differs from server clock.
   *
   * @see https://en.wikipedia.org/wiki/Network_Time_Protocol
   */
  currentTimeInMillis?: () => number;
  /** Manually provided OpenID provider metadata. */
  endpoints?: IEndpointConfiguration;
  /** Custom HTTP client (e.g. fetch wrapper). */
  httpClient?: (options: RequestOptions) => Promise<any>;
  /**
   * Additional ID token validator.
   * Use this to validate signatures or introduce custom rules.
   *
   * @param idToken Raw JWT string.
   */
  idTokenValidator?: (idToken: string) => Promise<boolean>;
  /** OpenID Provider issuer URL. */
  issuer: string;
  /**
   * Length of the generated nonce value.
   *
   * @default 10
   */
  nonceLength?: number;
  /**
   * Whether to request user information from the `userinfo_endpoint`
   * after token issuance.
   */
  requestUserInfo?: boolean;
  /**
   * How long before token expiration (in seconds) a silent renew should trigger.
   *
   * @default 60
   */
  secondsToRefreshAccessTokenBeforeExp?: number;
  /**
   * Timeout (in seconds) for silent renew iframe responses.
   *
   * @default 10
   */
  silentRequestTimeout?: number;
  /** Redirect URI used specifically for silent authentication. */
  silent_redirect_uri?: string;
  /**
   * Length of generated `state` values.
   *
   * @default 10
   */
  stateLength?: number;
  /**
   * Storage for OIDC request state (nonce, code_verifier, redirect params).
   *
   * @see StateStore
   */
  stateStore?: StateStore<any>;
  /**
   * Whether refresh tokens should be used for renewing sessions.
   * If `false`, the client will instead use an iframe silent authentication.
   *
   * @default false
   */
  useRefreshToken?: boolean;
}
/**
 * Parameters for OAuth2 token endpoint requests.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749#section-4
 */
interface TokenRequestOption {
  client_id?: string;
  client_secret?: string;
  code?: string;
  code_verifier?: string;
  extraTokenHeaders?: Record<string, string>;
  extraTokenParams?: Record<string, string>;
  grant_type?: string;
  redirect_uri?: string;
  refresh_token?: string;
}
/**
 * Popup-based login configuration.
 */
interface PopupOptions {
  /** The created popup window instance. */
  popup?: Window | null;
  /**
   * Timeout in milliseconds before assuming no response from the popup.
   *
   * @default 60000
   */
  timeout?: number;
}
/**
 * Configuration for iframe-based silent authentication.
 */
interface IFrameOptions {
  /** Origin used for validating incoming iframe messages. */
  eventOrigin: string;
  /**
   * Response timeout in milliseconds for the iframe.
   *
   * @default 60000
   */
  timeout?: number;
}
/**
 * Parsed representation of a JWT.
 */
interface ParsedJWT {
  /** JWT header object. */
  header: Partial<Record<JWTHeaderField, any>>;
  /** JWT payload excluding system claims (issuer, aud, exp…). */
  payload: Readonly<Record<(typeof nonUserClaims)[number], string | number>>;
  /** Optional raw signature segment. */
  signature?: string;
}
type TokenType = "access_token" | "refresh_token";
/**
 * Options for OAuth2 token revocation endpoint.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7009
 */
interface RevokeOptions {
  client_id?: string;
  client_secret?: string;
}
/**
 * Token endpoint response as defined by OAuth2 and extended by OIDC.
 */
interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  session_state?: string;
}
/**
 * Validation settings applied when verifying ID Tokens.
 */
interface JWTValidationOptions {
  audience?: string;
  /** Client ID to match against the `aud` claim. */
  client_id: string;
  /** Allowed clock drift in seconds. */
  clockSkew?: number;
  /** Time provider function. */
  currentTimeInMillis?: () => number;
  /** Expected token issuer. */
  issuer: string;
}
/**
 * Configuration for an OP session checker iframe.
 */
interface SessionCheckerOptions {
  /** Callback invoked on session state changes. */
  callback: (...args: any) => void;
  /** Polling interval in milliseconds. */
  checkInterval?: number;
  /** OAuth2 client ID. */
  client_id: string;
  /** URL of the OP session iframe. */
  url: string;
}
/**
 * Result returned by session-checker implementations.
 */
type SessionChecker = {
  /** Start monitoring with a given session_state. */
  start: (session_state: string) => void;
  /** Stop monitoring. */
  stop: () => void;
};
/**
 * Persisted record describing a single authorization request.
 */
type StateRecord = {
  /** Original authorization request parameters. */
  authParams: AuthRequestOptions;
  /** Creation timestamp (ms). */
  created_at: number;
  /** Custom local state used by the client application. */
  localState: Record<string, any>;
  /**
   * Request type:
   * - `"p"` popup
   * - `"s"` silent (iframe)
   * - `"d"` standard redirect
   */
  request_type: "p" | "s" | any;
};
/**
 * Persisted authentication result stored after successful authorization.
 */
type AuthRecord = {
  access_token?: string;
  authParams?: IPlusAuthClientOptions;
  expires_in?: number;
  id_token?: Record<string, any>;
  id_token_raw?: string;
  refresh_token?: string;
  scope?: string;
  session_state?: string;
  user?: Record<string, any>;
};
//#endregion
//#region src/client.d.ts
/**
 * `OIDCClient` provides methods for interacting with OIDC/OAuth2 authorization server. Those methods are signing a
 * user in, signing out, managing the user's claims, checking session and managing tokens returned from the
 * OIDC/OAuth2 provider.
 *
 */
declare class OIDCClient extends EventEmitter<EventTypes> {
  options: IPlusAuthClientOptions;
  user?: any;
  scopes?: string[];
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  idTokenRaw?: string;
  issuer_metadata?: Record<string, any>;
  private readonly http;
  private synchronizer;
  private stateStore;
  private authStore;
  private sessionCheckerFrame?;
  private _accessTokenExpireTimer?;
  private initialized;
  private __initializePromise;
  constructor(options: IPlusAuthClientOptions);
  /**
   * Initialize the library with this method. It resolves issuer configuration, jwks keys which are necessary for
   * validating tokens returned from provider and checking if a user is already authenticated in provider.
   *
   * @param checkLogin Make this `false` if you don't want to check user authorization status in provider while
   * initializing. Defaults to `true`
   */
  initialize(checkLogin?: boolean): Promise<OIDCClient> | never;
  /**
   * Redirect to provider's authorization endpoint using provided parameters. You can override any parameter defined
   * in `OIDCClient`. If you don't provide `state`, `nonce` or `code_verifier` they will be generated automatically
   * in a random and secure way.
   *
   * @param options
   * @param localState
   */
  login(options?: Partial<AuthRequestOptions>, localState?: Record<string, any>): Promise<void>;
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
  loginWithPopup(options?: Partial<AuthRequestOptions>, popupOptions?: PopupOptions): Promise<Record<string, any>>;
  /**
   * After a user successfully authorizes an application, the authorization server will redirect the user back to
   * the application with either an authorization code or access token in the URL. In the callback page you should
   * call this method.
   *
   * @param url Full url which contains authorization request result parameters. Defaults to `window.location.href`
   */
  loginCallback(url?: string): Promise<Record<string, any> | undefined>;
  /**
   * Redirect to provider's `end_session_endpoint` with provided parameters. After logout provider will redirect to
   * provided `post_logout_redirect_uri` if it provided.
   * @param options
   */
  logout(options?: LogoutRequestOptions): Promise<void>;
  /**
   * OAuth2 token revocation implementation method. See more at [tools.ietf.org/html/rfc7009](https://tools.ietf.org/html/rfc7009)
   * @param token Token to be revoked
   * @param type Passed token's type. It will be used to provide `token_type_hint` parameter.
   * @param options If necessary override options passed to `OIDCClient` by defining them here.
   */
  revokeToken(token: string, type?: TokenType, options?: RevokeOptions): Promise<any>;
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
  silentLogin(options?: AuthRequestOptions, localState?: Record<string, any>): Promise<any>;
  /**
   * Retrieve logged in user's access token if it exists.
   */
  getAccessToken(): Promise<string | undefined>;
  /**
   * Retrieve logged in user's refresh token if it exists.
   */
  getRefreshToken(): Promise<string | undefined>;
  /**
   * Retrieve logged in user's parsed id token if it exists.
   */
  getIdToken(): Promise<Record<string, any> | undefined>;
  /**
   * Retrieve access token's expiration.
   */
  getExpiresIn(): Promise<number | undefined>;
  /**
   * Retrieve logged in user's id token in raw format if it exists.
   */
  getIdTokenRaw(): Promise<string | undefined>;
  /**
   * Retrieve logged in user's scopes if it exists.
   */
  getScopes(): Promise<string[] | undefined>;
  /**
   * Retrieve logged in user's profile.
   */
  getUser(): Promise<Record<string, any> | undefined>;
  /**
   * If there is a user stored locally return true. Otherwise it will make a silentLogin to check if End-User is
   * logged in provider.
   *
   * @param localOnly Don't check provider
   */
  isLoggedIn(localOnly?: boolean): Promise<boolean>;
  /**
   * Create authorization request with provided options.
   *
   * @param options
   * @param localState
   * @private
   */
  private createAuthRequest;
  /**
   * Create a logout request with given options
   *
   * @param options
   * @private
   */
  private createLogoutRequest;
  /**
   * Exchange authorization code retrieved from auth request result.
   * @param options
   * @private
   */
  private exchangeAuthorizationCode;
  /**
   * Exchange refresh token with given options
   * @param options
   * @private
   */
  private exchangeRefreshToken;
  /**
   * Fetch OIDC configuration from the issuer.
   */
  private fetchFromIssuer;
  /**
   * Handle auth request result. If there is `code` exchange it.
   * @param response
   * @param finalOptions
   * @param localState
   * @private
   */
  private handleAuthResponse;
  /**
   * Handle OAuth2 auth request result
   * @param tokenResult
   * @param authParams
   * @param finalOptions
   * @private
   */
  private handleTokenResult;
  /**
   * Load stored state
   *
   * @param state
   * @private
   */
  private loadState;
  /**
   * Load user info by making request to providers `userinfo_endpoint`
   *
   * @param accessToken
   * @private
   */
  private fetchUserInfo;
  /**
   * Start monitoring End-User's session if the OIDC provider supports session management. See more at [OIDC Session
   * Management](https://openid.net/specs/openid-connect-session-1_0.html)
   *
   * @param sub End-User's id to for monitoring session
   * @param session_state string that represents the End-User's login state at the OP
   */
  private monitorSession;
  private onUserLogin;
}
//#endregion
//#region src/errors.d.ts
declare class OIDCClientError extends Error {
  error: string;
  error_description?: string;
  constructor(error: string, error_description?: string);
}
declare class AuthenticationError extends OIDCClientError {
  state?: string;
  error_uri?: string;
  constructor(error: string, error_description?: string, state?: string, error_uri?: string);
}
declare class StateNotFound extends AuthenticationError {
  state?: string;
  constructor(error: string, state?: string);
}
declare class InvalidJWTError extends OIDCClientError {
  constructor(details: string);
}
declare class InvalidIdTokenError extends InvalidJWTError {
  constructor(details: string);
}
declare class InteractionCancelled extends OIDCClientError {
  constructor(details: string);
}
//#endregion
//#region src/index.d.ts
/**
 * Create OIDC client with initializing it. It resolves issuer metadata, jwks keys and check if user is
 * authenticated in OpenId Connect provider.
 */
declare function createOIDCClient(options: IPlusAuthClientOptions): Promise<OIDCClient>;
//#endregion
export { AuthRecord, AuthRequestOptions, AuthenticationError, DefaultIframeAttributes, EventEmitter, EventTypes, Events, IEndpointConfiguration, IFrameOptions, IPlusAuthClientOptions, InMemoryStateStore, InteractionCancelled, InvalidIdTokenError, InvalidJWTError, JWTHeaderField, JWTValidationOptions, Listener, LocalStorageStateStore, LogoutRequestOptions, OIDCClient, OIDCClientError, ParsedJWT, PopupOptions, RevokeOptions, SessionChecker, SessionCheckerOptions, SessionMonitorOptions, StateNotFound, StateRecord, StateStore, TokenRequestOption, TokenResponse, TokenType, createOIDCClient as default };