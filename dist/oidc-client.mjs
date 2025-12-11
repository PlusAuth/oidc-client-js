/*!
 * @plusauth/oidc-client-js v1.8.0
 * https://github.com/PlusAuth/oidc-client-js
 * (c) 2025 @plusauth/oidc-client-js Contributors
 * Released under the MIT License
 */
import { fromByteArray } from "base64-js";

//#region src/constants/events.ts
const Events = {
	USER_LOGOUT: "user_logout",
	USER_LOGIN: "user_login",
	SILENT_RENEW_SUCCESS: "silent_renew_success",
	SILENT_RENEW_ERROR: "silent_renew_error",
	SESSION_CHANGE: "session_change"
};

//#endregion
//#region src/errors.ts
var OIDCClientError = class extends Error {
	constructor(error, error_description) {
		super(`${error}${error_description && ` - ${error_description}` || ""}`);
		this.name = "OIDCClientError";
		this.error = error;
		this.error_description = error_description;
	}
};
var AuthenticationError = class extends OIDCClientError {
	constructor(error, error_description, state, error_uri) {
		super(error, error_description);
		this.name = "AuthenticationError";
		this.state = state;
		this.error_uri = error_uri;
	}
};
var StateNotFound = class extends AuthenticationError {
	constructor(error, state) {
		super(error);
		this.name = "StateNotFound";
		this.state = state;
	}
};
var InvalidJWTError = class extends OIDCClientError {
	constructor(details) {
		super(details);
		this.name = "InvalidJWTError";
		this.error_description = details;
	}
};
var InvalidIdTokenError = class extends InvalidJWTError {
	constructor(details) {
		super(details);
		this.name = "InvalidIdTokenError";
	}
};
var InteractionCancelled = class extends OIDCClientError {
	constructor(details) {
		super(details);
		this.name = "InteractionCancelled";
	}
};

//#endregion
//#region src/helpers/event_emitter.ts
var EventEmitter = class {
	constructor() {
		this.callbacks = {};
	}
	once(event, fn) {
		function on(...onArgs) {
			this.off(event, on);
			fn.apply(this, onArgs);
		}
		on.fn = fn;
		this.on(event, on);
		return this;
	}
	on(event, cb) {
		if (!this.callbacks[`$${event}`]) this.callbacks[`$${event}`] = [];
		this.callbacks[`$${event}`].push(cb);
		return this;
	}
	off(event, fn) {
		if (!event) {
			this.callbacks = {};
			return this;
		}
		const callbacks = this.callbacks[`$${event}`];
		if (!callbacks) return this;
		if (!fn) {
			delete this.callbacks[`$${event}`];
			return this;
		}
		for (let i = 0; i < callbacks.length; i++) {
			const cb = callbacks[i];
			if (cb === fn || cb.fn === fn) {
				callbacks.splice(i, 1);
				break;
			}
		}
		if (callbacks.length === 0) delete this.callbacks[`$${event}`];
		return this;
	}
	emit(event, ...args) {
		let cbs = this.callbacks[`$${event}`];
		if (cbs) {
			cbs = cbs.slice(0);
			for (let i = 0, len = cbs.length; i < len; ++i) cbs[i].apply(this, args);
		}
		return this;
	}
};

//#endregion
//#region src/helpers/state_manager/state_store.ts
var StateStore = class {
	constructor(prefix = "") {
		this.prefix = prefix;
	}
};

//#endregion
//#region src/helpers/state_manager/in_memory.ts
var InMemoryStateStore = class extends StateStore {
	constructor(..._args) {
		super(..._args);
		this.map = /* @__PURE__ */ new Map();
	}
	clear(before) {
		if (before) {
			this.map.forEach((val, ind) => {
				if (val.created_at < before) this.map.delete(ind);
			});
			return Promise.resolve();
		}
		return Promise.resolve(this.map.clear());
	}
	del(key) {
		this.map.delete(key);
		return Promise.resolve();
	}
	get(key) {
		return Promise.resolve(this.map.get(key) || null);
	}
	set(key, value) {
		this.map.set(key, value);
		return Promise.resolve();
	}
};

//#endregion
//#region src/helpers/state_manager/local_storage.ts
var LocalStorageStateStore = class extends StateStore {
	constructor(prefix = "pa_oidc.") {
		super(prefix);
	}
	get(key) {
		return new Promise((resolve) => {
			const value = window.localStorage.getItem(this.prefix + key);
			if (value) resolve(JSON.parse(value));
			else resolve(null);
		});
	}
	set(key, value) {
		return new Promise((resolve) => {
			window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
			resolve();
		});
	}
	del(key) {
		return new Promise((resolve) => {
			window.localStorage.removeItem(this.prefix + key);
			resolve();
		});
	}
	clear(before) {
		return new Promise((resolve) => {
			let i;
			const storedKeys = [];
			for (i = 0; i < window.localStorage.length; i++) {
				const key = window.localStorage.key(i);
				if (key?.substring(0, this.prefix.length) === this.prefix) storedKeys.push(key);
			}
			for (i = 0; i < storedKeys.length; i++) if (before) try {
				if (JSON.parse(window.localStorage.getItem(storedKeys[i])).created_at < before) window.localStorage.removeItem(storedKeys[i]);
			} catch {}
			else window.localStorage.removeItem(storedKeys[i]);
			resolve();
		});
	}
};

//#endregion
//#region src/helpers/timer.ts
var Timer = class {
	constructor(currentTimeInMillisFunc = () => Date.now()) {
		this.now = currentTimeInMillisFunc;
	}
	start(duration, callback) {
		if (duration <= 0) duration = 1;
		const expiration = this.now() / 1e3 + duration;
		if (this._expiration === expiration && this._timerHandle) return;
		this.stop();
		this._expiration = expiration;
		let timerDuration = 5;
		if (duration < timerDuration) timerDuration = duration;
		this._timerHandle = setInterval(() => {
			if (this._expiration <= this.now() / 1e3) {
				this.stop();
				callback();
			}
		}, timerDuration * 1e3);
	}
	stop() {
		if (this._timerHandle) {
			clearInterval(this._timerHandle);
			this._timerHandle = null;
		}
	}
};

//#endregion
//#region src/utils/iframe.ts
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
const DefaultIframeAttributes = {
	title: "__pa_helper__hidden",
	"aria-hidden": "true"
};
function createHiddenFrame() {
	const iframe = window.document.createElement("iframe");
	iframe.style.width = "0";
	iframe.style.height = "0";
	iframe.style.position = "absolute";
	iframe.style.visibility = "hidden";
	iframe.style.display = "none";
	for (const [key, value] of Object.entries(DefaultIframeAttributes)) iframe.setAttribute(key, value);
	return iframe;
}
function runIframe(url, options) {
	return new Promise((resolve, reject) => {
		let onLoadTimeoutId = null;
		const timeoutMs = (options.timeout || 10) * 1e3;
		const iframe = createHiddenFrame();
		const timeoutSetTimeoutId = setTimeout(() => {
			reject(new OIDCClientError("Timed out"));
			removeIframe();
		}, timeoutMs);
		const iframeEventHandler = (e) => {
			if (e.origin !== options.eventOrigin) return;
			if (!e.data || e.data.type !== "authorization_response") return;
			const eventSource = e.source;
			if (eventSource) eventSource.close();
			const resp = e.data.response || e.data;
			resp.error ? reject(new AuthenticationError(resp.error, resp.error_description, resp.state, resp.error_uri)) : resolve(e.data);
			clearTimeout(timeoutSetTimeoutId);
			removeIframe();
		};
		const removeIframe = () => {
			if (onLoadTimeoutId != null) clearTimeout(onLoadTimeoutId);
			if (window.document.body.contains(iframe)) window.document.body.removeChild(iframe);
			window.removeEventListener("message", iframeEventHandler, false);
		};
		const onLoadTimeout = () => setTimeout(() => {
			reject(new OIDCClientError("Could not complete silent authentication", url));
			removeIframe();
		}, timeoutMs);
		window.addEventListener("message", iframeEventHandler, false);
		window.document.body.appendChild(iframe);
		iframe.setAttribute("src", url);
		/**
		* In case of wrong client id, wrong redirect_uri, in short when redirect did not happen
		* we assume flow failed.
		*/
		iframe.onload = () => {
			onLoadTimeoutId = onLoadTimeout();
		};
	});
}

//#endregion
//#region src/utils/check_session_iframe.ts
const DEFAULT_CHECK_INTERVAL = 2e3;
function createSessionCheckerFrame(options) {
	const { url, callback, client_id, checkInterval } = options;
	let internalSessionState;
	const idx = url.indexOf("/", url.indexOf("//") + 2);
	const frameOrigin = url.substr(0, idx);
	const frame = createHiddenFrame();
	let timer;
	const load = () => {
		return new Promise((resolve) => {
			window.document.body.appendChild(frame);
			window.addEventListener("message", iframeEventHandler, false);
			frame.onload = () => {
				resolve(null);
			};
		});
	};
	const start = (sessionState) => {
		load().then(() => {
			if (sessionState && internalSessionState !== sessionState) {
				stop();
				internalSessionState = sessionState;
				const send = () => {
					frame.contentWindow.postMessage(`${client_id} ${internalSessionState}`, frameOrigin);
				};
				send();
				timer = window.setInterval(send, checkInterval || DEFAULT_CHECK_INTERVAL);
			}
		});
	};
	const stop = () => {
		internalSessionState = null;
		if (timer) {
			window.clearInterval(timer);
			timer = null;
		}
	};
	const iframeEventHandler = (e) => {
		if (e.origin === frameOrigin && e.source === frame.contentWindow) {
			if (e.data === "error") {
				stop();
				callback(e.data);
			} else if (e.data === "changed") {
				stop();
				callback();
			}
		}
	};
	frame.setAttribute("src", url);
	return {
		stop,
		start
	};
}

//#endregion
//#region src/utils/url.ts
function isValidIssuer(issuer) {
	try {
		const url = new URL(issuer);
		if (!["http:", "https:"].includes(url.protocol)) return false;
		if (url.search !== "" || url.hash !== "") return false;
		return true;
	} catch {
		return false;
	}
}
function buildEncodedQueryString(obj, appendable = true) {
	if (!obj) return "";
	const ret = [];
	for (const d in obj) if (obj.hasOwnProperty(d) && obj[d]) ret.push(`${encodeURIComponent(d)}=${encodeURIComponent(typeof obj[d] === "object" ? JSON.stringify(obj[d]) : obj[d])}`);
	return `${appendable ? "?" : ""}${ret.join("&")}`;
}
function parseQueryUrl(value) {
	const result = {};
	value = value.trim().replace(/^(\?|#|&)/, "");
	const params = value.split("&");
	for (let i = 0; i < params.length; i += 1) {
		const parts = params[i].split("=");
		const key = decodeURIComponent(parts.shift());
		const value$1 = parts.length > 0 ? parts.join("=") : "";
		result[key] = decodeURIComponent(value$1);
	}
	return result;
}
function urlSafe(data) {
	return (typeof data === "string" ? data : fromByteArray(new Uint8Array(data))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

//#endregion
//#region src/utils/crypto.ts
async function sha256(str) {
	if (typeof window.crypto !== "undefined" && "subtle" in window.crypto) {
		const buffer = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
		return urlSafe(new Uint8Array(buffer));
	}
	return urlSafe(_sha256(str));
}
/**
* Generate sha-256 hash of a string.
*
* @link https://geraintluff.github.io/sha256/
*
* @param data data to generate hash of
* @param base64 By default the returned value is base64 encoded. If `false` format will be hex.
*/
function _sha256(data, base64 = true) {
	function rightRotate(value, amount) {
		return value >>> amount | value << 32 - amount;
	}
	const mathPow = Math.pow;
	const maxWord = mathPow(2, 32);
	const lengthProperty = "length";
	let i;
	let j;
	let result = "";
	const words = [];
	const asciiBitLength = data[lengthProperty] * 8;
	let hash = sha256.h = sha256.h || [];
	const k = sha256.k = sha256.k || [];
	let primeCounter = k[lengthProperty];
	const isComposite = {};
	for (let candidate = 2; primeCounter < 64; candidate++) if (!isComposite[candidate]) {
		for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
		hash[primeCounter] = mathPow(candidate, .5) * maxWord | 0;
		k[primeCounter++] = mathPow(candidate, 1 / 3) * maxWord | 0;
	}
	data += "";
	while (data[lengthProperty] % 64 - 56) data += "\0";
	for (i = 0; i < data[lengthProperty]; i++) {
		j = data.charCodeAt(i);
		if (j >> 8) return;
		words[i >> 2] |= j << (3 - i) % 4 * 8;
	}
	words[words[lengthProperty]] = asciiBitLength / maxWord | 0;
	words[words[lengthProperty]] = asciiBitLength;
	for (j = 0; j < words[lengthProperty];) {
		const w = words.slice(j, j += 16);
		const oldHash = hash;
		hash = hash.slice(0, 8);
		for (i = 0; i < 64; i++) {
			const w15 = w[i - 15];
			const w2 = w[i - 2];
			const a = hash[0];
			const e = hash[4];
			const temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + (e & hash[5] ^ ~e & hash[6]) + k[i] + (w[i] = i < 16 ? w[i] : w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ w15 >>> 3) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ w2 >>> 10) | 0);
			hash = [temp1 + ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + (a & hash[1] ^ a & hash[2] ^ hash[1] & hash[2])) | 0].concat(hash);
			hash[4] = hash[4] + temp1 | 0;
		}
		for (i = 0; i < 8; i++) hash[i] = hash[i] + oldHash[i] | 0;
	}
	for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) {
		const b = hash[i] >> j * 8 & 255;
		result += (b < 16 ? 0 : "") + b.toString(16);
	}
	return base64 ? btoa(result.match(/\w{2}/g).map((a) => String.fromCharCode(Number.parseInt(a, 16))).join("")) : result;
}

//#endregion
//#region src/utils/jose.ts
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function getRandomBytes(n) {
	const crypto = self.crypto || self.msCrypto;
	const QUOTA = 65536;
	const a = new Uint8Array(n);
	for (let i = 0; i < n; i += QUOTA) crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)));
	return a;
}
function generateRandom(length) {
	let out = "";
	const charsLen = 62;
	const maxByte = 256 - 256 % charsLen;
	while (length > 0) {
		const buf = getRandomBytes(Math.ceil(length * 256 / maxByte));
		for (let i = 0; i < buf.length && length > 0; i++) {
			const randomByte = buf[i];
			if (randomByte < maxByte) {
				out += CHARSET.charAt(randomByte % charsLen);
				length--;
			}
		}
	}
	return out;
}
async function deriveChallenge(code) {
	if (code.length < 43 || code.length > 128) return Promise.reject(new OIDCClientError(`Invalid code length: ${code.length}`));
	return await sha256(code);
}
const urlDecodeB64 = (input) => decodeURIComponent(atob(input.replace(/_/g, "/").replace(/-/g, "+")).split("").map((c) => {
	return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`;
}).join(""));
function parseJwt(jwt) {
	try {
		const parts = jwt.split(".");
		if (parts.length !== 3) throw new Error("Wrong JWT format");
		return {
			header: JSON.parse(urlDecodeB64(parts[0])),
			payload: JSON.parse(urlDecodeB64(parts[1]))
		};
	} catch {
		throw new InvalidJWTError("Failed to parse jwt");
	}
}
function validateIdToken(id_token, nonce, options) {
	if (!nonce) throw new OIDCClientError("No nonce on state");
	try {
		const jwt = parseJwt(id_token);
		if (nonce !== jwt.payload.nonce) throw new Error(`Invalid nonce in id_token: ${jwt.payload.nonce}`);
		validateJwt(id_token, options, true);
		if (!jwt.payload.sub) throw new Error("No Subject (sub) present in id_token");
		return jwt.payload;
	} catch (e) {
		throw new InvalidIdTokenError(e.message);
	}
}
function validateJwt(jwt, options, isIdToken = false) {
	let { clockSkew, currentTimeInMillis, issuer, audience, client_id } = options;
	if (!clockSkew) clockSkew = 0;
	const now = (currentTimeInMillis?.() || Date.now()) / 1e3;
	const payload = parseJwt(jwt).payload;
	if (!payload.iss) throw new InvalidJWTError("Issuer (iss) was not provided");
	if (payload.iss !== issuer) throw new InvalidJWTError(`Invalid Issuer (iss) in token: ${payload.iss}`);
	if (!payload.aud) throw new InvalidJWTError("Audience (aud) was not provided");
	if (Array.isArray(payload.aud) ? payload.aud.indexOf(isIdToken ? client_id : audience || client_id) === -1 : payload.aud !== (isIdToken ? client_id : audience || client_id)) throw new InvalidJWTError(`Invalid Audience (aud) in token: ${payload.aud}`);
	if (payload.azp && payload.azp !== client_id) throw new InvalidJWTError(`Invalid Authorized Party (azp) in token: ${payload.azp}`);
	const lowerNow = Math.ceil(now + clockSkew);
	const upperNow = Math.floor(now - clockSkew);
	if (!payload.iat) throw new InvalidJWTError("Issued At (iat) was not provided");
	if (lowerNow < Number(payload.iat)) throw new InvalidJWTError(`Issued At (iat) is in the future: ${payload.iat}`);
	if (payload.nbf && lowerNow < Number(payload.nbf)) throw new InvalidJWTError(`Not Before time (nbf) is in the future: ${payload.nbf}`);
	if (!payload.exp) throw new InvalidJWTError("Expiration Time (exp) was not provided");
	if (Number(payload.exp) < upperNow) throw new InvalidJWTError(`Expiration Time (exp) is in the past: ${payload.exp}`);
	return payload;
}
const nonUserClaims = [
	"iss",
	"aud",
	"exp",
	"nbf",
	"iat",
	"jti",
	"azp",
	"nonce",
	"auth_time",
	"at_hash",
	"c_hash",
	"acr",
	"amr",
	"sub_jwk",
	"cnf",
	"sip_from_tag",
	"sip_date",
	"sip_callid",
	"sip_cseq_num",
	"sip_via_branch",
	"orig",
	"dest",
	"mky",
	"events",
	"toe",
	"txn",
	"rph",
	"sid",
	"vot",
	"vtm",
	"attest",
	"origid",
	"act",
	"scope",
	"client_id",
	"may_act",
	"jcard",
	"at_use_nbr"
];

//#endregion
//#region src/utils/request.ts
function request(options) {
	let body = null;
	let headers = options.headers || {};
	if (options.method === "POST") headers = {
		"Content-Type": options.requestType === "form" ? "application/x-www-form-urlencoded;charset=UTF-8" : "application/json;charset=UTF-8",
		...headers
	};
	if (options.body) body = options.requestType === "form" ? buildEncodedQueryString(options.body, false) : JSON.stringify(options.body);
	return new Promise((resolve, reject) => {
		fetch(options.url, {
			method: options.method,
			body,
			headers
		}).then((value) => resolve(value.json())).catch(reject);
	});
}

//#endregion
//#region src/utils/object.ts
/**
* not suitable for every object but it is enough for this library
* @param object
*/
function cleanUndefined(object) {
	return JSON.parse(JSON.stringify(object));
}
function merge(previousValue, currentValue) {
	for (const p in currentValue) if (currentValue[p] !== void 0) if (typeof currentValue[p] === "object" && currentValue[p].constructor.name === "Object") previousValue[p] = merge(previousValue[p] || {}, currentValue[p]);
	else previousValue[p] = currentValue[p];
	return previousValue;
}
function mergeObjects(...objects) {
	return objects.reduce((previousValue, currentValue) => {
		return merge(previousValue || {}, currentValue);
	}, {});
}

//#endregion
//#region src/utils/oidc.ts
const isResponseType = (type, response_type) => response_type && response_type.split(/\s+/g).filter((rt) => rt === type).length > 0;
const isScopeIncluded = (scope, scopes) => scopes && scopes.split(" ").indexOf(scope) > -1;

//#endregion
//#region src/utils/popup.ts
const openPopup = (url, width = 400, height = 600) => {
	const left = window.screenX + (window.innerWidth - width) / 2;
	const top = window.screenY + (window.innerHeight - height) / 2;
	return window.open(url, "oidc-login-popup", `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`);
};
function runPopup(url, options) {
	let popup = options.popup;
	if (popup) popup.location.href = url;
	else popup = openPopup(url);
	if (!popup)
 /* istanbul ignore next */
	throw new Error("Could not open popup");
	let timeoutId;
	let closeId;
	return new Promise((resolve, reject) => {
		function clearHandlers() {
			clearInterval(closeId);
			clearTimeout(timeoutId);
			window.removeEventListener("message", messageListener);
		}
		const timeoutMs = (options.timeout || 60) * 1e3;
		timeoutId = setTimeout(() => {
			clearHandlers();
			reject(new OIDCClientError("Timed out"));
		}, timeoutMs);
		closeId = setInterval(() => {
			if (popup.closed) {
				clearHandlers();
				reject(new InteractionCancelled("user closed popup"));
			}
		}, timeoutMs);
		window.addEventListener("message", messageListener);
		function messageListener(e) {
			if (!e.data || e.data.type !== "authorization_response") return;
			clearHandlers();
			popup.close();
			const data = e.data.response || e.data;
			data.error ? reject(new OIDCClientError(data.error, data.error_description)) : resolve(e.data);
		}
	});
}

//#endregion
//#region src/utils/tab_utils.ts
const currentTabId = `${performance.now()}:${Math.random() * 1e9 | 0}`;
const handlers = {};
var TabUtils = class {
	constructor(kid, fallbackEvents) {
		this.keyPrefix = kid;
		this.events = fallbackEvents;
	}
	CallOnce(lockname, fn, timeout = 3e3) {
		if (!lockname) throw "empty lockname";
		if (!window.localStorage) {
			fn();
			return;
		}
		const localStorageKey = this.keyPrefix + lockname;
		localStorage.setItem(localStorageKey, currentTabId);
		setTimeout(() => {
			if (localStorage.getItem(localStorageKey) === currentTabId) fn();
		}, 150);
		setTimeout(() => {
			localStorage.removeItem(localStorageKey);
		}, timeout);
	}
	BroadcastMessageToAllTabs(messageId, eventData) {
		try {
			handlers[messageId](eventData);
		} catch {}
		if (!window.localStorage) {
			this.events.emit(messageId, eventData);
			return;
		}
		const data = {
			data: eventData,
			timeStamp: Date.now()
		};
		localStorage.setItem(`${this.keyPrefix}event${messageId}`, JSON.stringify(data));
		setTimeout(() => {
			localStorage.removeItem(`${this.keyPrefix}event${messageId}`);
		}, 3e3);
	}
	OnBroadcastMessage(messageId, fn) {
		handlers[messageId] = fn;
		if (!window.localStorage) {
			this.events.on(messageId, fn);
			return;
		}
		window.addEventListener("storage", (ev) => {
			if (ev.key !== `${this.keyPrefix}event${messageId}`) return;
			if (!ev.newValue) return;
			fn(JSON.parse(ev.newValue).data);
		});
	}
};

//#endregion
//#region src/client.ts
/**
* `OIDCClient` provides methods for interacting with OIDC/OAuth2 authorization server. Those methods are signing a
* user in, signing out, managing the user's claims, checking session and managing tokens returned from the
* OIDC/OAuth2 provider.
*
*/
var OIDCClient = class extends EventEmitter {
	constructor(options) {
		super();
		if (!isValidIssuer(options.issuer)) throw new OIDCClientError("\"issuer\" must be a valid uri.");
		this.synchronizer = new TabUtils(btoa(options.issuer), this);
		this.options = mergeObjects({
			secondsToRefreshAccessTokenBeforeExp: 60,
			autoSilentRenew: true,
			checkSession: true,
			stateLength: 10,
			nonceLength: 10
		}, options, { issuer: options.issuer.endsWith("/") ? options.issuer.slice(0, -1) : options.issuer });
		this.http = this.options.httpClient || request;
		this.stateStore = this.options.stateStore || new LocalStorageStateStore("pa_oidc.state.");
		this.authStore = this.options.authStore || new InMemoryStateStore();
		if (this.options.autoSilentRenew) this._accessTokenExpireTimer = new Timer();
		this.on(Events.USER_LOGOUT, async () => {
			this.user = void 0;
			this.scopes = void 0;
			this.accessToken = void 0;
			this.idToken = void 0;
			this.refreshToken = void 0;
			await this.authStore.clear();
		});
		this.synchronizer.OnBroadcastMessage(Events.USER_LOGIN, this.onUserLogin.bind(this));
	}
	/**
	* Initialize the library with this method. It resolves issuer configuration, jwks keys which are necessary for
	* validating tokens returned from provider and checking if a user is already authenticated in provider.
	*
	* @param checkLogin Make this `false` if you don't want to check user authorization status in provider while
	* initializing. Defaults to `true`
	*/
	async initialize(checkLogin = true) {
		if (this.initialized) return this;
		if (this.__initializePromise) return this.__initializePromise;
		this.__initializePromise = new Promise(async (resolve, reject) => {
			try {
				if (this.stateStore.init) await this.stateStore.init();
				if (this.authStore.init) await this.authStore.init();
				if (!this.options.endpoints || Object.keys(this.options.endpoints).length === 0) await this.fetchFromIssuer();
				this.initialized = true;
				if (checkLogin) try {
					if (!window?.frameElement) await this.silentLogin();
				} catch (e) {
					this.emit(Events.SILENT_RENEW_ERROR, e);
					await this.authStore.clear();
				}
				else {
					const localAuth = await this.authStore.get("auth");
					if (localAuth) await this.onUserLogin(localAuth, true);
				}
				resolve(this);
			} catch (e) {
				if (e instanceof OIDCClientError) reject(e);
				else reject(new OIDCClientError(e.message));
			} finally {
				this.__initializePromise = void 0;
			}
		});
		return this.__initializePromise;
	}
	/**
	* Redirect to provider's authorization endpoint using provided parameters. You can override any parameter defined
	* in `OIDCClient`. If you don't provide `state`, `nonce` or `code_verifier` they will be generated automatically
	* in a random and secure way.
	*
	* @param options
	* @param localState
	*/
	async login(options = {}, localState = {}) {
		window.location.assign(await this.createAuthRequest(options, localState));
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
	async loginWithPopup(options = {}, popupOptions = {}) {
		const { response, state } = await runPopup(await this.createAuthRequest({
			response_mode: "fragment",
			...options,
			display: "popup",
			request_type: "p"
		}), popupOptions);
		const { authParams, localState } = !state || typeof state === "string" ? await this.loadState(state || response.state) : state;
		const tokenResult = await this.handleAuthResponse(response, authParams, localState);
		const authObject = await this.handleTokenResult(tokenResult, authParams, mergeObjects(this.options, authParams));
		authObject.session_state = response.session_state;
		this.synchronizer.BroadcastMessageToAllTabs(Events.USER_LOGIN, authObject);
		return localState;
	}
	/**
	* After a user successfully authorizes an application, the authorization server will redirect the user back to
	* the application with either an authorization code or access token in the URL. In the callback page you should
	* call this method.
	*
	* @param url Full url which contains authorization request result parameters. Defaults to `window.location.href`
	*/
	async loginCallback(url = window?.location?.href) {
		if (!url) return Promise.reject(new OIDCClientError("Url must be passed to handle login redirect"));
		let parsedUrl;
		try {
			parsedUrl = new URL(url);
		} catch {
			return Promise.reject(new OIDCClientError(`Invalid callback url passed: "${url}"`));
		}
		const responseParams = parseQueryUrl(parsedUrl.search || parsedUrl.hash);
		const rawStoredState = await this.loadState(responseParams.state);
		const { authParams, localState, request_type } = rawStoredState;
		url = url || window.location.href;
		switch (request_type) {
			case "s":
				if (window?.frameElement) {
					if (url) window.parent.postMessage({
						type: "authorization_response",
						response: responseParams,
						state: rawStoredState
					}, `${location.protocol}//${location.host}`);
				}
				return;
			case "p":
				if (window.opener && url) window.opener.postMessage({
					type: "authorization_response",
					response: responseParams,
					state: rawStoredState
				}, `${location.protocol}//${location.host}`);
				return;
			default: {
				if (responseParams.error) return Promise.reject(new AuthenticationError(responseParams.error, responseParams.error_description));
				const tokenResult = await this.handleAuthResponse(responseParams, authParams, localState);
				const authObject = await this.handleTokenResult(tokenResult, authParams, mergeObjects(this.options, authParams));
				authObject.session_state = responseParams.session_state;
				this.synchronizer.BroadcastMessageToAllTabs(Events.USER_LOGIN, authObject);
				return localState;
			}
		}
	}
	/**
	* Redirect to provider's `end_session_endpoint` with provided parameters. After logout provider will redirect to
	* provided `post_logout_redirect_uri` if it provided.
	* @param options
	*/
	async logout(options = {}) {
		if (!options.localOnly) {
			const storedAuth = await this.authStore.get("auth");
			const id_token_hint = options.id_token_hint || storedAuth?.id_token_raw;
			window.location.assign(await this.createLogoutRequest({
				...options,
				id_token_hint
			}));
		}
		await this.authStore.clear();
	}
	/**
	* OAuth2 token revocation implementation method. See more at [tools.ietf.org/html/rfc7009](https://tools.ietf.org/html/rfc7009)
	* @param token Token to be revoked
	* @param type Passed token's type. It will be used to provide `token_type_hint` parameter.
	* @param options If necessary override options passed to `OIDCClient` by defining them here.
	*/
	async revokeToken(token, type = "access_token", options = {}) {
		if (!this.options.endpoints.revocation_endpoint) return Promise.reject(new OIDCClientError("\"revocation_endpoint\" doesn't exist"));
		const finalOptions = {
			client_id: options.client_id || this.options.client_id,
			client_secret: options.client_secret || this.options.client_secret,
			token_type_hint: type,
			token
		};
		return this.http({
			method: "POST",
			requestType: "form",
			url: this.options.endpoints.revocation_endpoint,
			body: finalOptions
		});
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
	async silentLogin(options = {}, localState = {}) {
		await this.initialize(false);
		let tokenResult;
		let finalState = {};
		const storedAuth = await this.authStore.get("auth") || {};
		const finalOptions = mergeObjects({
			response_mode: "query",
			display: "page",
			prompt: "none"
		}, this.options, options);
		if (finalOptions.silent_redirect_uri) finalOptions.redirect_uri = finalOptions.silent_redirect_uri;
		if (this.options.useRefreshToken && storedAuth?.refresh_token) {
			finalState.authParams = mergeObjects(storedAuth?.authParams || {}, finalState.authParams || {});
			tokenResult = await this.exchangeRefreshToken({
				...finalOptions,
				refresh_token: storedAuth.refresh_token
			});
		} else {
			const { response, state } = await runIframe(await this.createAuthRequest({
				...finalOptions,
				request_type: "s"
			}, localState), {
				timeout: finalOptions.silentRequestTimeout,
				eventOrigin: window.location.origin
			});
			tokenResult = await this.handleAuthResponse(response, finalOptions, localState);
			storedAuth.session_state = response.session_state;
			finalState = state;
		}
		const authObject = await this.handleTokenResult(tokenResult, finalState.authParams, finalOptions);
		authObject.session_state = storedAuth.session_state;
		this.synchronizer.BroadcastMessageToAllTabs(Events.USER_LOGIN, authObject);
		return finalState.localState;
	}
	/**
	* Retrieve logged in user's access token if it exists.
	*/
	async getAccessToken() {
		return (await this.authStore.get("auth"))?.access_token;
	}
	/**
	* Retrieve logged in user's refresh token if it exists.
	*/
	async getRefreshToken() {
		return (await this.authStore.get("auth"))?.refresh_token;
	}
	/**
	* Retrieve logged in user's parsed id token if it exists.
	*/
	async getIdToken() {
		return (await this.authStore.get("auth"))?.id_token;
	}
	/**
	* Retrieve access token's expiration.
	*/
	async getExpiresIn() {
		return (await this.authStore.get("auth"))?.expires_in;
	}
	/**
	* Retrieve logged in user's id token in raw format if it exists.
	*/
	async getIdTokenRaw() {
		return (await this.authStore.get("auth"))?.id_token_raw;
	}
	/**
	* Retrieve logged in user's scopes if it exists.
	*/
	async getScopes() {
		return (await this.authStore.get("auth"))?.scope?.split(" ").filter(Boolean);
	}
	/**
	* Retrieve logged in user's profile.
	*/
	async getUser() {
		return (await this.authStore.get("auth"))?.user;
	}
	/**
	* If there is a user stored locally return true. Otherwise it will make a silentLogin to check if End-User is
	* logged in provider.
	*
	* @param localOnly Don't check provider
	*/
	async isLoggedIn(localOnly = false) {
		const existsOnLocal = !!await this.getUser();
		if (!existsOnLocal && !localOnly) try {
			await this.silentLogin();
			return true;
		} catch (_e) {
			return false;
		}
		return existsOnLocal;
	}
	/**
	* Create authorization request with provided options.
	*
	* @param options
	* @param localState
	* @private
	*/
	async createAuthRequest(options = {}, localState = {}) {
		if (!this.options.endpoints?.authorization_endpoint) await this.initialize(false);
		const finalOptions = Object.assign({}, this.options, options);
		localState.code_verifier = generateRandom(72);
		const authParams = {
			client_id: finalOptions.client_id,
			state: finalOptions.state || generateRandom(finalOptions.stateLength),
			scope: finalOptions.scope,
			audience: finalOptions.audience,
			redirect_uri: finalOptions.redirect_uri,
			response_mode: finalOptions.response_mode,
			response_type: finalOptions.response_type || "code",
			ui_locales: finalOptions.ui_locales,
			prompt: finalOptions.prompt,
			display: finalOptions.display,
			claims: finalOptions.claims,
			claims_locales: finalOptions.claims_locales,
			acr_values: finalOptions.acr_values,
			nonce: finalOptions.nonce,
			registration: finalOptions.registration,
			login_hint: finalOptions.login_hint,
			id_token_hint: finalOptions.id_token_hint,
			web_message_uri: finalOptions.web_message_uri,
			web_message_target: finalOptions.web_message_target,
			...finalOptions.extraParams && finalOptions.extraParams
		};
		if (!authParams.nonce && (isResponseType("id_token", authParams.response_type) || isScopeIncluded("openid", authParams.scope))) authParams.nonce = generateRandom(finalOptions.nonceLength);
		if (isResponseType("code", authParams.response_type)) {
			authParams.code_challenge = await deriveChallenge(localState.code_verifier);
			authParams.code_challenge_method = finalOptions.code_challenge_method || "S256";
		}
		const now = this.options.currentTimeInMillis?.() || Date.now();
		const fragment = finalOptions.fragment ? `#${finalOptions.fragment}` : "";
		const authParamsString = buildEncodedQueryString(authParams);
		const url = `${this.options.endpoints.authorization_endpoint}${authParamsString}${fragment}`;
		this.stateStore.clear(now - 864e5);
		await this.stateStore.set(authParams.state, cleanUndefined({
			created_at: now,
			authParams,
			localState,
			request_type: finalOptions.request_type
		}));
		return url;
	}
	/**
	* Create a logout request with given options
	*
	* @param options
	* @private
	*/
	async createLogoutRequest(options = {}) {
		if (!this.options.endpoints?.end_session_endpoint) await this.fetchFromIssuer();
		const finalOptions = mergeObjects(this.options, options);
		const logoutParams = {
			id_token_hint: finalOptions.id_token_hint,
			post_logout_redirect_uri: finalOptions.post_logout_redirect_uri,
			...finalOptions.extraLogoutParams || {}
		};
		return `${this.options.endpoints.end_session_endpoint}${buildEncodedQueryString(logoutParams)}`;
	}
	/**
	* Exchange authorization code retrieved from auth request result.
	* @param options
	* @private
	*/
	async exchangeAuthorizationCode(options) {
		if (!this.options.endpoints?.token_endpoint) await this.fetchFromIssuer();
		const { extraTokenHeaders, extraTokenParams, ...rest } = mergeObjects(this.options, options);
		const mergedOptions = {
			...rest,
			...extraTokenParams || {},
			grant_type: "authorization_code"
		};
		for (const req of [
			"code",
			"redirect_uri",
			"code_verifier",
			"client_id"
		]) if (!mergedOptions[req]) return Promise.reject(/* @__PURE__ */ new Error(`"${req}" is required`));
		return this.http({
			url: `${this.options.endpoints.token_endpoint}`,
			method: "POST",
			requestType: "form",
			body: mergedOptions,
			headers: extraTokenHeaders
		});
	}
	/**
	* Exchange refresh token with given options
	* @param options
	* @private
	*/
	async exchangeRefreshToken(options) {
		if (!this.options.endpoints?.token_endpoint) await this.fetchFromIssuer();
		const { extraTokenHeaders, extraTokenParams, ...rest } = options;
		const mergedOptions = {
			grant_type: "refresh_token",
			client_id: this.options.client_id,
			client_secret: this.options.client_secret,
			...rest,
			...extraTokenParams || {}
		};
		for (const req of ["refresh_token", "client_id"]) if (!mergedOptions[req]) return Promise.reject(/* @__PURE__ */ new Error(`"${req}" is required`));
		return this.http({
			url: `${this.options.endpoints.token_endpoint}`,
			method: "POST",
			requestType: "form",
			body: mergedOptions,
			headers: extraTokenHeaders
		});
	}
	/**
	* Fetch OIDC configuration from the issuer.
	*/
	async fetchFromIssuer() {
		try {
			const requestUrl = `${this.options.issuer}/.well-known/openid-configuration`;
			this.issuer_metadata = await this.http({
				url: requestUrl,
				method: "GET",
				requestType: "json"
			});
			const endpoints = {};
			for (const prop of Object.keys(this.issuer_metadata)) if (prop.endsWith("_endpoint") || prop.indexOf("_session") > -1 || prop.indexOf("_uri") > -1) endpoints[prop] = this.issuer_metadata[prop];
			this.options.endpoints = endpoints;
			return this.issuer_metadata;
		} catch (e) {
			throw new OIDCClientError("Loading metadata failed", e.message);
		}
	}
	/**
	* Handle auth request result. If there is `code` exchange it.
	* @param response
	* @param finalOptions
	* @param localState
	* @private
	*/
	async handleAuthResponse(response, finalOptions, localState = {}) {
		if (response.code) return this.exchangeAuthorizationCode({
			redirect_uri: finalOptions.redirect_uri,
			client_id: finalOptions.client_id,
			code_verifier: localState.code_verifier,
			grant_type: "authorization_code",
			code: response.code
		});
		return response;
	}
	/**
	* Handle OAuth2 auth request result
	* @param tokenResult
	* @param authParams
	* @param finalOptions
	* @private
	*/
	async handleTokenResult(tokenResult, authParams, finalOptions) {
		await this.initialize(false);
		let user = {};
		if (tokenResult.error) throw new AuthenticationError(tokenResult.error, tokenResult.error_description);
		let parsedIDToken;
		if (tokenResult.id_token) {
			parsedIDToken = await validateIdToken(tokenResult.id_token, authParams.nonce, finalOptions);
			if (finalOptions.idTokenValidator && !await finalOptions.idTokenValidator(tokenResult.id_token)) return Promise.reject(new InvalidIdTokenError("Id Token validation failed"));
			Object.keys(parsedIDToken).forEach((key) => {
				if (!nonUserClaims.includes(key)) user[key] = parsedIDToken[key];
			});
		}
		if (tokenResult.access_token) {
			if (finalOptions.requestUserInfo && this.options.endpoints?.userinfo_endpoint) {
				const userInfoResult = await this.fetchUserInfo(tokenResult.access_token);
				if (!userInfoResult.error) user = {
					...user,
					...userInfoResult
				};
			}
		}
		return {
			authParams,
			user,
			...tokenResult,
			id_token: parsedIDToken,
			id_token_raw: tokenResult.id_token,
			scope: tokenResult.scope !== void 0 ? tokenResult.scope : authParams.scope
		};
	}
	/**
	* Load stored state
	*
	* @param state
	* @private
	*/
	async loadState(state) {
		const rawStoredState = await this.stateStore.get(state);
		if (!rawStoredState) return Promise.reject(new StateNotFound("Local state not found", state));
		await this.stateStore.del(state);
		return rawStoredState;
	}
	/**
	* Load user info by making request to providers `userinfo_endpoint`
	*
	* @param accessToken
	* @private
	*/
	async fetchUserInfo(accessToken) {
		return this.http({
			method: "GET",
			url: `${this.options.endpoints.userinfo_endpoint}`,
			requestType: "json",
			headers: { Authorization: `Bearer ${accessToken}` }
		});
	}
	/**
	* Start monitoring End-User's session if the OIDC provider supports session management. See more at [OIDC Session
	* Management](https://openid.net/specs/openid-connect-session-1_0.html)
	*
	* @param sub End-User's id to for monitoring session
	* @param session_state string that represents the End-User's login state at the OP
	*/
	monitorSession({ sub, session_state }) {
		const { client_id, endpoints } = this.options;
		if (!endpoints?.check_session_iframe) {
			console.warn("\"check_session_iframe\" endpoint missing or session management is not supported by provider");
			return;
		}
		if (!this.sessionCheckerFrame) {
			const sessionCheckCallback = async (err) => {
				if (err) this.emit(Events.USER_LOGOUT);
				else {
					this.emit(Events.SESSION_CHANGE);
					try {
						await this.silentLogin({}, {});
						const storedAuth = await this.authStore.get("auth");
						if (storedAuth) {
							if (storedAuth.user?.sub === sub && storedAuth.session_state) this.sessionCheckerFrame.start(storedAuth.session_state);
						} else this.emit(Events.USER_LOGOUT, null);
					} catch (_e) {
						this.emit(Events.USER_LOGOUT);
						return;
					}
				}
			};
			this.sessionCheckerFrame = createSessionCheckerFrame({
				url: endpoints.check_session_iframe,
				client_id,
				callback: sessionCheckCallback,
				checkInterval: this.options.checkSessionInterval
			});
		}
		this.sessionCheckerFrame.start(session_state);
	}
	async onUserLogin(authObj, isInternal = false) {
		const { expires_in, user, scope, access_token, id_token, refresh_token, session_state, id_token_raw } = authObj;
		await this.authStore.set("auth", authObj);
		this.user = user;
		this.scopes = scope?.split(" ").filter(Boolean);
		this.accessToken = access_token;
		this.idToken = id_token;
		this.idTokenRaw = id_token_raw;
		this.refreshToken = refresh_token;
		if (!isInternal) this.emit(Events.USER_LOGIN, authObj);
		if (!window?.frameElement) {
			if (this.options.checkSession) this.monitorSession({
				sub: user.sub || user.id,
				session_state
			});
			if (expires_in !== void 0 && this.options.autoSilentRenew) {
				const expiration = Number(expires_in) - this.options.secondsToRefreshAccessTokenBeforeExp;
				const renew = () => {
					this.synchronizer.CallOnce("silent-login", async () => {
						try {
							await this.silentLogin();
							this.emit(Events.SILENT_RENEW_SUCCESS, null);
						} catch (e) {
							this.emit(Events.SILENT_RENEW_ERROR, e);
						}
					});
				};
				if (expiration >= 0) this._accessTokenExpireTimer.start(expiration, async () => {
					renew();
				});
				else renew();
			}
		}
	}
};

//#endregion
//#region src/index.ts
/**
* Create OIDC client with initializing it. It resolves issuer metadata, jwks keys and check if user is
* authenticated in OpenId Connect provider.
*/
function createOIDCClient(options) {
	return new OIDCClient(options).initialize();
}

//#endregion
export { AuthenticationError, DefaultIframeAttributes, EventEmitter, Events, InMemoryStateStore, InteractionCancelled, InvalidIdTokenError, InvalidJWTError, LocalStorageStateStore, OIDCClient, OIDCClientError, StateNotFound, StateStore, createOIDCClient as default };