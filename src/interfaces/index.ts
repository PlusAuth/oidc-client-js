import { StateStore } from '../helpers';
import { nonUserClaims, RequestOptions } from '../utils';

// https://tools.ietf.org/html/draft-ietf-jose-json-web-encryption-40
// https://tools.ietf.org/html/draft-ietf-jose-json-web-signature-41
export type JWTHeaderField = 'typ' | 'cty' | 'alg' | 'zip' | 'jku' | 'jwk' |
'kid' | 'x5u' | 'x5c' | 'x5t' | 'x5t#S256' | 'crit' | 'exp'

export interface AuthRequestOptions {
  acr_values?: string;
  audience?: string;
  claims?: Record<string, any>;
  claims_locales?: string;
  client_id?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  code_verifier?: string;
  display?: string;
  extraParams?: { [key: string]: any };
  fragment?: string;
  id_token_hint?: string,
  login_hint?: string,
  nonce?: string;
  prompt?: string;
  redirect_uri?: string;
  registration?: string;
  request_type?: 's' | 'p' | 'd',
  response_mode?: string;
  response_type?: string;
  scope?: string;
  state?: string;
  ui_locales?: string;
  web_message_target?: string;
  web_message_uri?: string;
}

export interface SessionMonitorOptions {
  session_state: string,
  sub: string;
}

export interface LogoutRequestOptions {
  extraLogoutParams?: { [key: string]: string },
  id_token_hint?: string;
  localOnly?: boolean,
  post_logout_redirect_uri?: string;
}

export interface IEndpointConfiguration {
  authorization_endpoint?: string,
  check_session_iframe?: string,
  device_authorization_endpoint?: string,
  end_session_endpoint?: string,
  introspection_endpoint?: string,
  jwks_uri?: string;
  mfa_endpoint?: string,
  registration_endpoint?: string,
  revocation_endpoint?: string,
  token_endpoint?: string,
  userinfo_endpoint?: string
}

export interface IPlusAuthClientOptions extends Omit<AuthRequestOptions, 'request_type'>,
  Omit<LogoutRequestOptions, 'localOnly'> {
  authStore?: StateStore;
  /**
   * Enable/disable automatic access token renewal. If enabled, access tokens will be refreshed by using silent
   * login in an iframe before they expire.
   *
   * Also see {@link secondsToRefreshAccessTokenBeforeExp}
   */
  autoSilentRenew?: boolean;
  /**
   * Enable/Disable session monitoring.
   */
  checkSession?: boolean;

  /**
   * Session checking interval in milliseconds. Defaults to 2000
   */
  checkSessionInterval?: number;

  client_id: string;

  client_secret?: string;
  /**
   * The amount of clock skew tolerated for time comparisons between the Authorization server and client in seconds.
   */
  clockSkew?: number;

  /**
   * Custom current time function to be used for time related operations. If client clock is far ahead or far before
   * from authorization server's time, token validations will fail. If any [Network Time
   * Protocol](https://en.wikipedia.org/wiki/Network_Time_Protocol) service used, use this method to provide current
   * time to the library.
   */
  currentTimeInMillis?: () => number;

  endpoints?: IEndpointConfiguration,

  httpClient?: ( options: RequestOptions ) => Promise<any>;
  /**
   * Additional id token validator. By default only payload fields validated. If you need additional validations,
   * like signature validation, you should implement and provide it with this option.
   *
   * @param idToken raw id token string
   */
  idTokenValidator?: ( idToken: string ) => Promise<boolean>;
  issuer: string;
  /**
   * Fetch user profile by using [UserInfo
   * Request](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoRequest) after successful authorization.
   * Usually this wouldn't not be necessary if id token is received.
   */
  requestUserInfo?: boolean;

  /**
   * The number of seconds before an access token is to expire to renew it automatically. Related to {@link autoSilentRenew}
   */
  secondsToRefreshAccessTokenBeforeExp?: number;

  /**
   * Number of seconds to wait for the silent renew to return before assuming it has failed or timed out (default: 10). Related to {@link autoSilentRenew}
   */
  silentRequestTimeout?: number;

  silent_redirect_uri?: string;

  /**
   * Custom state store. See {@link StateStore}
   */
  stateStore?: StateStore;
  /**
   * If `true`, refresh tokens will be used for renewing access token. If `false`, authorization request will be
   * performed silently in an iframe.
   */
  useRefreshToken?: boolean;
}

export interface TokenRequestOption {
  client_id: string;
  client_secret?: string;
  code?: string;
  code_verifier?: string;
  extraTokenHeaders?: Record<string, string>;
  extraTokenParams?: Record<string, string>;
  grant_type?: string;
  redirect_uri?: string;
  refresh_token?: string;
}

export interface PopupOptions {
  popup?: Window | null;
  /**
   * Popup response timeout in milliseconds
   * @default 60000
   */
  timeout?: number;
}

export interface IFrameOptions {
  eventOrigin: string,
  /**
   * Iframe response timeout in milliseconds.
   * @default 60000
   */
  timeout?: number;

}

export interface ParsedJWT {
  header: Partial<Record<JWTHeaderField, any>>;
  payload: Readonly<Record< typeof nonUserClaims[number], string | number>>,
  signature?: string;
}

export type TokenType = 'access_token' | 'refresh_token'

export interface RevokeOptions{
  client_id?: string;
  client_secret?: string;
}

export interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string,
  expires_at?: number;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  session_state?: string;
}

export interface JWTValidationOptions {
  audience?: string;
  client_id: string;
  clockSkew?: number;
  currentTimeInMillis?: () => number;
  issuer: string;
}

export interface SessionCheckerOptions {
  callback: ( ...args: any ) => void,
  checkInterval?: number,
  client_id: string;
  url: string;
}

export type SessionChecker = {
  start: ( session_state: string ) => void;
  stop: () => void;
}
