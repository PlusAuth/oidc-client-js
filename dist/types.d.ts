declare const Events: {
    readonly USER_LOGOUT: "user_logout";
    readonly USER_LOGIN: "user_login";
    readonly SILENT_RENEW_SUCCESS: "silent_renew_success";
    readonly SILENT_RENEW_ERROR: "silent_renew_error";
    readonly SESSION_CHANGE: "session_change";
};
type EventTypes = "user_logout" | "user_login" | "silent_renew_success" | "silent_renew_error" | "session_change" | "session_error";

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

declare class LocalStorageStateStore<T = any> extends StateStore<T> {
    constructor(prefix?: string);
    get(key: string): Promise<T | null>;
    set(key: string, value: T): Promise<void>;
    del(key: string): Promise<void>;
    clear(before?: number): Promise<void>;
}

declare class InMemoryStateStore<T = any> extends StateStore<T> {
    map: Map<any, any>;
    clear(before?: number): Promise<void>;
    del(key: string): Promise<void>;
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}

type Listener = (...args: any) => void;
declare class EventEmitter<T extends string> {
    callbacks: Record<string, any[]>;
    constructor();
    once(event: T, fn: (...args: any[]) => void): this;
    on(event: T, cb: (...args: any[]) => void): this;
    off(event?: T, fn?: (...args: any[]) => void): this;
    emit(event: T, ...args: any[]): this;
}

interface RequestOptions {
    body?: Record<string, string | number | null | undefined>;
    headers?: Record<string, string>;
    method: "GET" | "POST" | "PATCH" | "TRACE" | "OPTIONS" | "HEAD";
    requestType?: "form" | "json";
    url: string;
}

declare const nonUserClaims: readonly ["iss", "aud", "exp", "nbf", "iat", "jti", "azp", "nonce", "auth_time", "at_hash", "c_hash", "acr", "amr", "sub_jwk", "cnf", "sip_from_tag", "sip_date", "sip_callid", "sip_cseq_num", "sip_via_branch", "orig", "dest", "mky", "events", "toe", "txn", "rph", "sid", "vot", "vtm", "attest", "origid", "act", "scope", "client_id", "may_act", "jcard", "at_use_nbr"];

type JWTHeaderField = "typ" | "cty" | "alg" | "zip" | "jku" | "jwk" | "kid" | "x5u" | "x5c" | "x5t" | "x5t#S256" | "crit" | "exp";
interface AuthRequestOptions {
    acr_values?: string;
    audience?: string;
    claims?: Record<string, any>;
    claims_locales?: string;
    client_id?: string;
    code_challenge?: string;
    code_challenge_method?: string;
    code_verifier?: string;
    display?: string;
    extraParams?: {
        [key: string]: any;
    };
    fragment?: string;
    id_token_hint?: string;
    login_hint?: string;
    nonce?: string;
    prompt?: string;
    redirect_uri?: string;
    registration?: string;
    request_type?: "s" | "p" | "d";
    response_mode?: string;
    response_type?: string;
    scope?: string;
    state?: string;
    ui_locales?: string;
    web_message_target?: string;
    web_message_uri?: string;
}
interface SessionMonitorOptions {
    session_state: string;
    sub: string;
}
interface LogoutRequestOptions {
    extraLogoutParams?: {
        [key: string]: string;
    };
    id_token_hint?: string;
    localOnly?: boolean;
    post_logout_redirect_uri?: string;
}
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
interface IPlusAuthClientOptions extends Omit<AuthRequestOptions, "request_type">, Omit<LogoutRequestOptions, "localOnly"> {
    authStore?: StateStore<any>;
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
    endpoints?: IEndpointConfiguration;
    httpClient?: (options: RequestOptions) => Promise<any>;
    /**
     * Additional id token validator. By default only payload fields validated. If you need additional validations,
     * like signature validation, you should implement and provide it with this option.
     *
     * @param idToken raw id token string
     */
    idTokenValidator?: (idToken: string) => Promise<boolean>;
    issuer: string;
    /**
     * Generated nonce length. Defaults to 10
     * @default 10
     */
    nonceLength?: number;
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
     * Generated state length. Defaults to 10
     * @default 10
     */
    stateLength?: number;
    /**
     * Custom state store. See {@link StateStore}
     */
    stateStore?: StateStore<any>;
    /**
     * If `true`, refresh tokens will be used for renewing access token. If `false`, authorization request will be
     * performed silently in an iframe.
     */
    useRefreshToken?: boolean;
}
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
interface PopupOptions {
    popup?: Window | null;
    /**
     * Popup response timeout in milliseconds
     * @default 60000
     */
    timeout?: number;
}
interface IFrameOptions {
    eventOrigin: string;
    /**
     * Iframe response timeout in milliseconds.
     * @default 60000
     */
    timeout?: number;
}
interface ParsedJWT {
    header: Partial<Record<JWTHeaderField, any>>;
    payload: Readonly<Record<(typeof nonUserClaims)[number], string | number>>;
    signature?: string;
}
type TokenType = "access_token" | "refresh_token";
interface RevokeOptions {
    client_id?: string;
    client_secret?: string;
}
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
interface JWTValidationOptions {
    audience?: string;
    client_id: string;
    clockSkew?: number;
    currentTimeInMillis?: () => number;
    issuer: string;
}
interface SessionCheckerOptions {
    callback: (...args: any) => void;
    checkInterval?: number;
    client_id: string;
    url: string;
}
type SessionChecker = {
    start: (session_state: string) => void;
    stop: () => void;
};
type StateRecord = {
    authParams: AuthRequestOptions;
    created_at: number;
    localState: Record<string, any>;
    request_type: "p" | "s" | any;
};
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

/**
 * Create OIDC client with initializing it. It resolves issuer metadata, jwks keys and check if user is
 * authenticated in OpenId Connect provider.
 */
declare function createOIDCClient(options: IPlusAuthClientOptions): Promise<OIDCClient>;

export { type AuthRecord, type AuthRequestOptions, AuthenticationError, EventEmitter, type EventTypes, Events, type IEndpointConfiguration, type IFrameOptions, type IPlusAuthClientOptions, InMemoryStateStore, InteractionCancelled, InvalidIdTokenError, InvalidJWTError, type JWTHeaderField, type JWTValidationOptions, type Listener, LocalStorageStateStore, type LogoutRequestOptions, OIDCClient, OIDCClientError, type ParsedJWT, type PopupOptions, type RevokeOptions, type SessionChecker, type SessionCheckerOptions, type SessionMonitorOptions, StateNotFound, type StateRecord, StateStore, type TokenRequestOption, type TokenResponse, type TokenType, createOIDCClient as default };
