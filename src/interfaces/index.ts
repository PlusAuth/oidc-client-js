import type { StateStore } from "../helpers"
import type { nonUserClaims, RequestOptions } from "../utils"

/**
 * Standard JOSE header fields used in JWT / JWS / JWE structures.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7515
 * @see https://www.rfc-editor.org/rfc/rfc7516
 */
export type JWTHeaderField =
  | "typ"
  | "cty"
  | "alg"
  | "zip"
  | "jku"
  | "jwk"
  | "kid"
  | "x5u"
  | "x5c"
  | "x5t"
  | "x5t#S256"
  | "crit"
  | "exp"

/**
 * Options used when creating an authorization request.
 * Most fields map directly to OpenID Connect or OAuth2 parameters.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 */
export interface AuthRequestOptions {
  /** Requested Authentication Context Class Reference values. */
  acr_values?: string
  /** Audience for which the client is requesting access. */
  audience?: string
  /** Claims parameter requesting specific user attributes. */
  claims?: Record<string, any>
  /** Preferred languages for user claims. */
  claims_locales?: string
  /** OAuth2 client identifier. */
  client_id?: string
  /** PKCE code challenge. */
  code_challenge?: string
  /** PKCE code challenge method (typically `"S256"`). */
  code_challenge_method?: string
  /** PKCE verifier used for exchanging authorization code. */
  code_verifier?: string
  /** Display type: `page`, `popup`, etc. */
  display?: string
  /** Additional parameters appended to the authorization request. */
  extraParams?: Record<string, any>
  /** Optional URI fragment used by web_message or custom response handling. */
  fragment?: string
  /** Id token hint for reauthentication scenarios. */
  id_token_hint?: string
  /** Optional login hint such as email or username. */
  login_hint?: string
  /** Generated nonce for replay protection. */
  nonce?: string
  /** Prompt behavior: `none`, `login`, `consent`, etc. */
  prompt?: string
  /** Redirect URI registered for the client. */
  redirect_uri?: string
  /** Client registration parameter (rarely used). */
  registration?: string
  /**
   * Internal request type:
   * - `"s"` → silent
   * - `"p"` → popup
   * - `"d"` → standard redirect
   */
  request_type?: "s" | "p" | "d"
  /** OAuth2/OIDC response mode such as `fragment`, `query`, `form_post`. */
  response_mode?: string
  /** OAuth2/OIDC response type such as `code`, `token`, `id_token`. */
  response_type?: string
  /** Requested scopes. */
  scope?: string
  /** Client-generated state value used for request correlation. */
  state?: string
  /** Preferred UI locales for login experience. */
  ui_locales?: string
  /** Web Message response target (used in popup/iframe login). */
  web_message_target?: string
  /** Web Message receiver URL. */
  web_message_uri?: string
}

/**
 * Parameters required by the session monitor iframe.
 */
export interface SessionMonitorOptions {
  /** Session state received from OP during authentication. */
  session_state: string
  /** Subject identifier of the authenticated user. */
  sub: string
}

/**
 * Options used when generating a logout request.
 */
export interface LogoutRequestOptions {
  /** Additional provider-specific parameters for logout endpoint. */
  extraLogoutParams?: Record<string, string>
  /** Original ID token issued during login (recommended for OpenID logout). */
  id_token_hint?: string
  /** Do not redirect to OP for logout; clear local state only. */
  localOnly?: boolean
  /** Redirect URL after logout completes. */
  post_logout_redirect_uri?: string
}

/**
 * OpenID Provider metadata (discovery document).
 *
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
 */
export interface IEndpointConfiguration {
  authorization_endpoint?: string
  check_session_iframe?: string
  device_authorization_endpoint?: string
  end_session_endpoint?: string
  introspection_endpoint?: string
  jwks_uri?: string
  mfa_endpoint?: string
  registration_endpoint?: string
  revocation_endpoint?: string
  token_endpoint?: string
  userinfo_endpoint?: string
}

/**
 * Options used when instantiating the PlusAuth client.
 * Extends authorization and logout options with client-level configuration.
 */
export interface IPlusAuthClientOptions
  extends Omit<AuthRequestOptions, "request_type">,
    Omit<LogoutRequestOptions, "localOnly"> {
  /**
   * Storage for authentication results (id_token, access_token, session_state …).
   * Defaults to `LocalStorageStateStore`.
   *
   * @see StateStore
   */
  authStore?: StateStore<any>

  /**
   * Whether to automatically refresh access tokens before they expire
   * by triggering a silent login flow inside an iframe.
   *
   * @default true
   */
  autoSilentRenew?: boolean

  /**
   * Enable or disable OpenID session monitoring.
   *
   * @default true
   */
  checkSession?: boolean

  /**
   * How often to poll the session iframe (in ms).
   *
   * @default 2000
   */
  checkSessionInterval?: number

  /** OAuth2 client identifier. */
  client_id: string

  /** OAuth2 client secret (optional; required when using confidential flows). */
  client_secret?: string

  /**
   * Allowed clock drift (in seconds) when validating tokens.
   */
  clockSkew?: number

  /**
   * Custom function returning the current timestamp in milliseconds.
   * Useful when client clock differs from server clock.
   *
   * @see https://en.wikipedia.org/wiki/Network_Time_Protocol
   */
  currentTimeInMillis?: () => number

  /** Manually provided OpenID provider metadata. */
  endpoints?: IEndpointConfiguration

  /** Custom HTTP client (e.g. fetch wrapper). */
  httpClient?: (options: RequestOptions) => Promise<any>

  /**
   * Additional ID token validator.
   * Use this to validate signatures or introduce custom rules.
   *
   * @param idToken Raw JWT string.
   */
  idTokenValidator?: (idToken: string) => Promise<boolean>

  /** OpenID Provider issuer URL. */
  issuer: string

  /**
   * Length of the generated nonce value.
   *
   * @default 10
   */
  nonceLength?: number

  /**
   * Whether to request user information from the `userinfo_endpoint`
   * after token issuance.
   */
  requestUserInfo?: boolean

  /**
   * How long before token expiration (in seconds) a silent renew should trigger.
   *
   * @default 60
   */
  secondsToRefreshAccessTokenBeforeExp?: number

  /**
   * Timeout (in seconds) for silent renew iframe responses.
   *
   * @default 10
   */
  silentRequestTimeout?: number

  /** Redirect URI used specifically for silent authentication. */
  silent_redirect_uri?: string

  /**
   * Length of generated `state` values.
   *
   * @default 10
   */
  stateLength?: number

  /**
   * Storage for OIDC request state (nonce, code_verifier, redirect params).
   *
   * @see StateStore
   */
  stateStore?: StateStore<any>

  /**
   * Whether refresh tokens should be used for renewing sessions.
   * If `false`, the client will instead use an iframe silent authentication.
   *
   * @default false
   */
  useRefreshToken?: boolean
}

/**
 * Parameters for OAuth2 token endpoint requests.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749#section-4
 */
export interface TokenRequestOption {
  client_id?: string
  client_secret?: string
  code?: string
  code_verifier?: string
  extraTokenHeaders?: Record<string, string>
  extraTokenParams?: Record<string, string>
  grant_type?: string
  redirect_uri?: string
  refresh_token?: string
}

/**
 * Popup-based login configuration.
 */
export interface PopupOptions {
  /** The created popup window instance. */
  popup?: Window | null

  /**
   * Timeout in milliseconds before assuming no response from the popup.
   *
   * @default 60000
   */
  timeout?: number
}

/**
 * Configuration for iframe-based silent authentication.
 */
export interface IFrameOptions {
  /** Origin used for validating incoming iframe messages. */
  eventOrigin: string

  /**
   * Response timeout in milliseconds for the iframe.
   *
   * @default 60000
   */
  timeout?: number
}

/**
 * Parsed representation of a JWT.
 */
export interface ParsedJWT {
  /** JWT header object. */
  header: Partial<Record<JWTHeaderField, any>>

  /** JWT payload excluding system claims (issuer, aud, exp…). */
  payload: Readonly<Record<(typeof nonUserClaims)[number], string | number>>

  /** Optional raw signature segment. */
  signature?: string
}

export type TokenType = "access_token" | "refresh_token"

/**
 * Options for OAuth2 token revocation endpoint.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7009
 */
export interface RevokeOptions {
  client_id?: string
  client_secret?: string
}

/**
 * Token endpoint response as defined by OAuth2 and extended by OIDC.
 */
export interface TokenResponse {
  access_token?: string
  error?: string
  error_description?: string
  expires_in?: number
  id_token?: string
  refresh_token?: string
  scope?: string
  session_state?: string
}

/**
 * Validation settings applied when verifying ID Tokens.
 */
export interface JWTValidationOptions {
  audience?: string
  /** Client ID to match against the `aud` claim. */
  client_id: string
  /** Allowed clock drift in seconds. */
  clockSkew?: number
  /** Time provider function. */
  currentTimeInMillis?: () => number
  /** Expected token issuer. */
  issuer: string
}

/**
 * Configuration for an OP session checker iframe.
 */
export interface SessionCheckerOptions {
  /** Callback invoked on session state changes. */
  callback: (...args: any) => void
  /** Polling interval in milliseconds. */
  checkInterval?: number
  /** OAuth2 client ID. */
  client_id: string
  /** URL of the OP session iframe. */
  url: string
}

/**
 * Result returned by session-checker implementations.
 */
export type SessionChecker = {
  /** Start monitoring with a given session_state. */
  start: (session_state: string) => void
  /** Stop monitoring. */
  stop: () => void
}

/**
 * Persisted record describing a single authorization request.
 */
export type StateRecord = {
  /** Original authorization request parameters. */
  authParams: AuthRequestOptions
  /** Creation timestamp (ms). */
  created_at: number
  /** Custom local state used by the client application. */
  localState: Record<string, any>
  /**
   * Request type:
   * - `"p"` popup
   * - `"s"` silent (iframe)
   * - `"d"` standard redirect
   */
  request_type: "p" | "s" | any
}

/**
 * Persisted authentication result stored after successful authorization.
 */
export type AuthRecord = {
  access_token?: string
  authParams?: IPlusAuthClientOptions
  expires_in?: number
  id_token?: Record<string, any>
  id_token_raw?: string
  refresh_token?: string
  scope?: string
  session_state?: string
  user?: Record<string, any>
}
