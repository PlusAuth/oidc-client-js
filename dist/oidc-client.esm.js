/*!
 * @plusauth/oidc-client-js v1.7.1
 * https://github.com/PlusAuth/oidc-client-js
 * (c) 2025 @plusauth/oidc-client-js Contributors
 * Released under the MIT License
 */
/* eslint-disable @typescript-eslint/indent */ const Events = {
    USER_LOGOUT: "user_logout",
    USER_LOGIN: "user_login",
    SILENT_RENEW_SUCCESS: "silent_renew_success",
    SILENT_RENEW_ERROR: "silent_renew_error",
    SESSION_CHANGE: "session_change"
};

function _define_property$6(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
class OIDCClientError extends Error {
    constructor(error, error_description){
        super(`${error}${error_description && ` - ${error_description}` || ""}`), _define_property$6(this, "error", void 0), _define_property$6(this, "error_description", void 0);
        this.name = "OIDCClientError";
        this.error = error;
        this.error_description = error_description;
    }
}
class AuthenticationError extends OIDCClientError {
    constructor(error, error_description, state, error_uri){
        super(error, error_description), _define_property$6(this, "state", void 0), _define_property$6(this, "error_uri", void 0);
        this.name = "AuthenticationError";
        this.state = state;
        this.error_uri = error_uri;
    }
}
class StateNotFound extends AuthenticationError {
    constructor(error, state){
        super(error), _define_property$6(this, "state", void 0);
        this.name = "StateNotFound";
        this.state = state;
    }
}
class InvalidJWTError extends OIDCClientError {
    constructor(details){
        super(details);
        this.name = "InvalidJWTError";
        this.error_description = details;
    }
}
class InvalidIdTokenError extends InvalidJWTError {
    constructor(details){
        super(details);
        this.name = "InvalidIdTokenError";
    }
}
class InteractionCancelled extends OIDCClientError {
    constructor(details){
        super(details);
        this.name = "InteractionCancelled";
    }
}

function _define_property$5(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
// biome-ignore  lint/suspicious/noUnsafeDeclarationMerging:
class StateStore {
    constructor(prefix = ""){
        _define_property$5(this, "prefix", void 0);
        this.prefix = prefix;
    }
}

class LocalStorageStateStore extends StateStore {
    get(key) {
        return new Promise((resolve)=>{
            const value = window.localStorage.getItem(this.prefix + key);
            if (value) {
                resolve(JSON.parse(value));
            } else {
                resolve(null);
            }
        });
    }
    set(key, value) {
        return new Promise((resolve)=>{
            window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
            resolve();
        });
    }
    del(key) {
        return new Promise((resolve)=>{
            window.localStorage.removeItem(this.prefix + key);
            resolve();
        });
    }
    clear(before) {
        return new Promise((resolve)=>{
            let i;
            const storedKeys = [];
            for(i = 0; i < window.localStorage.length; i++){
                const key = window.localStorage.key(i);
                // items only created by oidc client
                if ((key === null || key === void 0 ? void 0 : key.substring(0, this.prefix.length)) === this.prefix) {
                    storedKeys.push(key);
                }
            }
            for(i = 0; i < storedKeys.length; i++){
                if (before) {
                    try {
                        const storedItem = JSON.parse(window.localStorage.getItem(storedKeys[i]));
                        if (storedItem.created_at < before) {
                            window.localStorage.removeItem(storedKeys[i]);
                        }
                    } catch (e) {}
                } else {
                    window.localStorage.removeItem(storedKeys[i]);
                }
            }
            resolve();
        });
    }
    constructor(prefix = "pa_oidc."){
        super(prefix);
    }
}

function _define_property$4(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
class InMemoryStateStore extends StateStore {
    clear(before) {
        if (before) {
            this.map.forEach((val, ind)=>{
                if (val.created_at < before) {
                    this.map.delete(ind);
                }
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
    constructor(...args){
        super(...args), _define_property$4(this, "map", new Map());
    }
}

function _define_property$3(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
class EventEmitter {
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
        // specific event
        const callbacks = this.callbacks[`$${event}`];
        if (!callbacks) return this;
        // remove all handlers
        if (!fn) {
            delete this.callbacks[`$${event}`];
            return this;
        }
        for(let i = 0; i < callbacks.length; i++){
            const cb = callbacks[i];
            if (cb === fn || cb.fn === fn) {
                callbacks.splice(i, 1);
                break;
            }
        }
        // Remove event specific arrays for event types that no
        // one is subscribed for to avoid memory leak.
        if (callbacks.length === 0) {
            delete this.callbacks[`$${event}`];
        }
        return this;
    }
    emit(event, ...args) {
        let cbs = this.callbacks[`$${event}`];
        if (cbs) {
            cbs = cbs.slice(0);
            for(let i = 0, len = cbs.length; i < len; ++i){
                cbs[i].apply(this, args);
            }
        }
        return this;
    }
    constructor(){
        _define_property$3(this, "callbacks", void 0);
        this.callbacks = {};
    }
}

function _define_property$2(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
class Timer {
    start(duration, callback) {
        if (duration <= 0) {
            duration = 1;
        }
        const expiration = this.now() / 1000 + duration;
        if (this._expiration === expiration && this._timerHandle) {
            return;
        }
        this.stop();
        this._expiration = expiration;
        // prevent device sleep and delayed timers
        let timerDuration = 5;
        if (duration < timerDuration) {
            timerDuration = duration;
        }
        this._timerHandle = setInterval(()=>{
            if (this._expiration <= this.now() / 1000) {
                this.stop();
                callback();
            }
        }, timerDuration * 1000);
    }
    stop() {
        if (this._timerHandle) {
            clearInterval(this._timerHandle);
            this._timerHandle = null;
        }
    }
    constructor(currentTimeInMillisFunc = ()=>Date.now()){
        _define_property$2(this, "now", void 0);
        _define_property$2(this, "_timerHandle", void 0);
        _define_property$2(this, "_expiration", void 0);
        this.now = currentTimeInMillisFunc;
    }
}

function createHiddenFrame() {
    const iframe = window.document.createElement("iframe");
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.position = "absolute";
    iframe.style.visibility = "hidden";
    iframe.style.display = "none";
    iframe.title = "__pa_helper__hidden";
    iframe.ariaHidden = "true";
    return iframe;
}
function runIframe(url, options) {
    return new Promise((resolve, reject)=>{
        let onLoadTimeoutId = null;
        const timeoutMs = (options.timeout || 10) * 1000;
        const iframe = createHiddenFrame();
        const timeoutSetTimeoutId = setTimeout(()=>{
            reject(new OIDCClientError("Timed out"));
            removeIframe();
        }, timeoutMs);
        const iframeEventHandler = (e)=>{
            if (e.origin !== options.eventOrigin) return;
            if (!e.data || e.data.type !== "authorization_response") return;
            const eventSource = e.source;
            if (eventSource) {
                eventSource.close();
            }
            const resp = e.data.response || e.data;
            resp.error ? reject(new AuthenticationError(resp.error, resp.error_description, resp.state, resp.error_uri)) : resolve(e.data);
            clearTimeout(timeoutSetTimeoutId);
            removeIframe();
        };
        const removeIframe = ()=>{
            if (onLoadTimeoutId != null) {
                clearTimeout(onLoadTimeoutId);
            }
            if (window.document.body.contains(iframe)) {
                window.document.body.removeChild(iframe);
            }
            window.removeEventListener("message", iframeEventHandler, false);
        };
        const onLoadTimeout = ()=>setTimeout(()=>{
                reject(new OIDCClientError("Could not complete silent authentication", url));
                removeIframe();
            }, timeoutMs);
        window.addEventListener("message", iframeEventHandler, false);
        window.document.body.appendChild(iframe);
        iframe.setAttribute("src", url);
        /**
     * In case of wrong client id, wrong redirect_uri, in short when redirect did not happen
     * we assume flow failed.
     */ iframe.onload = ()=>{
            onLoadTimeoutId = onLoadTimeout();
        };
    });
}

var base64Js = {};

var hasRequiredBase64Js;

function requireBase64Js () {
	if (hasRequiredBase64Js) return base64Js;
	hasRequiredBase64Js = 1;

	base64Js.byteLength = byteLength;
	base64Js.toByteArray = toByteArray;
	base64Js.fromByteArray = fromByteArray;

	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i];
	  revLookup[code.charCodeAt(i)] = i;
	}

	// Support decoding URL-safe base64 strings, as Node.js does.
	// See: https://en.wikipedia.org/wiki/Base64#URL_applications
	revLookup['-'.charCodeAt(0)] = 62;
	revLookup['_'.charCodeAt(0)] = 63;

	function getLens (b64) {
	  var len = b64.length;

	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // Trim off extra bytes after placeholder bytes are found
	  // See: https://github.com/beatgammit/base64-js/issues/42
	  var validLen = b64.indexOf('=');
	  if (validLen === -1) validLen = len;

	  var placeHoldersLen = validLen === len
	    ? 0
	    : 4 - (validLen % 4);

	  return [validLen, placeHoldersLen]
	}

	// base64 is 4/3 + up to two characters of the original data
	function byteLength (b64) {
	  var lens = getLens(b64);
	  var validLen = lens[0];
	  var placeHoldersLen = lens[1];
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function _byteLength (b64, validLen, placeHoldersLen) {
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function toByteArray (b64) {
	  var tmp;
	  var lens = getLens(b64);
	  var validLen = lens[0];
	  var placeHoldersLen = lens[1];

	  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));

	  var curByte = 0;

	  // if there are placeholders, only get up to the last complete 4 chars
	  var len = placeHoldersLen > 0
	    ? validLen - 4
	    : validLen;

	  var i;
	  for (i = 0; i < len; i += 4) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 18) |
	      (revLookup[b64.charCodeAt(i + 1)] << 12) |
	      (revLookup[b64.charCodeAt(i + 2)] << 6) |
	      revLookup[b64.charCodeAt(i + 3)];
	    arr[curByte++] = (tmp >> 16) & 0xFF;
	    arr[curByte++] = (tmp >> 8) & 0xFF;
	    arr[curByte++] = tmp & 0xFF;
	  }

	  if (placeHoldersLen === 2) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 2) |
	      (revLookup[b64.charCodeAt(i + 1)] >> 4);
	    arr[curByte++] = tmp & 0xFF;
	  }

	  if (placeHoldersLen === 1) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 10) |
	      (revLookup[b64.charCodeAt(i + 1)] << 4) |
	      (revLookup[b64.charCodeAt(i + 2)] >> 2);
	    arr[curByte++] = (tmp >> 8) & 0xFF;
	    arr[curByte++] = tmp & 0xFF;
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] +
	    lookup[num >> 12 & 0x3F] +
	    lookup[num >> 6 & 0x3F] +
	    lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp;
	  var output = [];
	  for (var i = start; i < end; i += 3) {
	    tmp =
	      ((uint8[i] << 16) & 0xFF0000) +
	      ((uint8[i + 1] << 8) & 0xFF00) +
	      (uint8[i + 2] & 0xFF);
	    output.push(tripletToBase64(tmp));
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  var tmp;
	  var len = uint8.length;
	  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
	  var parts = [];
	  var maxChunkLength = 16383; // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1];
	    parts.push(
	      lookup[tmp >> 2] +
	      lookup[(tmp << 4) & 0x3F] +
	      '=='
	    );
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
	    parts.push(
	      lookup[tmp >> 10] +
	      lookup[(tmp >> 4) & 0x3F] +
	      lookup[(tmp << 2) & 0x3F] +
	      '='
	    );
	  }

	  return parts.join('')
	}
	return base64Js;
}

var base64JsExports = requireBase64Js();

function isValidIssuer(issuer) {
    try {
        const url = new URL(issuer);
        if (![
            "http:",
            "https:"
        ].includes(url.protocol)) {
            return false;
        }
        if (url.search !== "" || url.hash !== "") {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}
function buildEncodedQueryString(obj, appendable = true) {
    if (!obj) return "";
    const ret = [];
    for(const d in obj){
        if (obj.hasOwnProperty(d) && obj[d]) {
            ret.push(`${encodeURIComponent(d)}=${encodeURIComponent(typeof obj[d] === "object" ? JSON.stringify(obj[d]) : obj[d])}`);
        }
    }
    return `${appendable ? "?" : ""}${ret.join("&")}`;
}
function parseQueryUrl(value) {
    const result = {};
    value = value.trim().replace(/^(\?|#|&)/, "");
    const params = value.split("&");
    for(let i = 0; i < params.length; i += 1){
        const paramAndValue = params[i];
        const parts = paramAndValue.split("=");
        const key = decodeURIComponent(parts.shift());
        const value = parts.length > 0 ? parts.join("=") : "";
        result[key] = decodeURIComponent(value);
    }
    return result;
}
function urlSafe(data) {
    const encoded = typeof data === "string" ? data : base64JsExports.fromByteArray(new Uint8Array(data));
    return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function request(options) {
    let body = null;
    let headers = options.headers || {};
    if (options.method === "POST") {
        headers = {
            "Content-Type": options.requestType === "form" ? "application/x-www-form-urlencoded;charset=UTF-8" : "application/json;charset=UTF-8",
            ...headers
        };
    }
    if (options.body) {
        body = options.requestType === "form" ? buildEncodedQueryString(options.body, false) : JSON.stringify(options.body);
    }
    return new Promise((resolve, reject)=>{
        fetch(options.url, {
            method: options.method,
            body: body,
            headers
        }).then((value)=>resolve(value.json())).catch(reject);
    });
}

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
 */ function _sha256(data, base64 = true) {
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
    // @ts-ignore
    let hash = sha256.h = sha256.h || [];
    // @ts-ignore
    const k = sha256.k = sha256.k || [];
    let primeCounter = k[lengthProperty];
    const isComposite = {};
    for(let candidate = 2; primeCounter < 64; candidate++){
        if (!isComposite[candidate]) {
            for(i = 0; i < 313; i += candidate){
                isComposite[i] = candidate;
            }
            hash[primeCounter] = mathPow(candidate, 0.5) * maxWord | 0;
            k[primeCounter++] = mathPow(candidate, 1 / 3) * maxWord | 0;
        }
    }
    data += "\x80" // Append ?' bit (plus zero padding)
    ;
    while(data[lengthProperty] % 64 - 56)data += "\x00" // More zero padding
    ;
    for(i = 0; i < data[lengthProperty]; i++){
        j = data.charCodeAt(i);
        if (j >> 8) return; // ASCII check: only accept characters in range 0-255
        words[i >> 2] |= j << (3 - i) % 4 * 8;
    }
    words[words[lengthProperty]] = asciiBitLength / maxWord | 0;
    words[words[lengthProperty]] = asciiBitLength;
    for(j = 0; j < words[lengthProperty];){
        const w = words.slice(j, j += 16);
        const oldHash = hash;
        hash = hash.slice(0, 8);
        for(i = 0; i < 64; i++){
            const w15 = w[i - 15];
            const w2 = w[i - 2];
            const a = hash[0];
            const e = hash[4];
            const temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + // S1
            (e & hash[5] ^ ~e & hash[6]) + // ch
            k[i] + (w[i] = i < 16 ? w[i] : w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ w15 >>> 3) + // s0
            w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ w2 >>> 10) | // s1
            0);
            const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + // S0
            (a & hash[1] ^ a & hash[2] ^ hash[1] & hash[2] // maj
            );
            hash = [
                temp1 + temp2 | 0
            ].concat(hash);
            hash[4] = hash[4] + temp1 | 0;
        }
        for(i = 0; i < 8; i++){
            hash[i] = hash[i] + oldHash[i] | 0;
        }
    }
    for(i = 0; i < 8; i++){
        for(j = 3; j + 1; j--){
            const b = hash[i] >> j * 8 & 255;
            result += (b < 16 ? 0 : "") + b.toString(16);
        }
    }
    return base64 ? btoa(result.match(/\w{2}/g).map((a)=>String.fromCharCode(Number.parseInt(a, 16))).join("")) : result;
}

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function getRandomBytes(n) {
    // @ts-ignore
    const crypto = self.crypto || self.msCrypto;
    const QUOTA = 65536;
    const a = new Uint8Array(n);
    for(let i = 0; i < n; i += QUOTA){
        crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)));
    }
    return a;
}
function generateRandom(length) {
    let out = "";
    const charsLen = CHARSET.length;
    const maxByte = 256 - 256 % charsLen;
    while(length > 0){
        const buf = getRandomBytes(Math.ceil(length * 256 / maxByte));
        for(let i = 0; i < buf.length && length > 0; i++){
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
    if (code.length < 43 || code.length > 128) {
        return Promise.reject(new OIDCClientError(`Invalid code length: ${code.length}`));
    }
    return await sha256(code);
}
// https://datatracker.ietf.org/doc/html/rfc4648#section-5
const urlDecodeB64 = (input)=>decodeURIComponent(atob(input.replace(/_/g, "/").replace(/-/g, "+")).split("").map((c)=>{
        return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`;
    }).join(""));
function parseJwt(jwt) {
    try {
        const parts = jwt.split(".");
        if (parts.length !== 3) {
            throw new Error("Wrong JWT format");
        }
        return {
            header: JSON.parse(urlDecodeB64(parts[0])),
            payload: JSON.parse(urlDecodeB64(parts[1]))
        };
    } catch (e) {
        throw new InvalidJWTError("Failed to parse jwt");
    }
}
function validateIdToken(id_token, nonce, options) {
    if (!nonce) {
        throw new OIDCClientError("No nonce on state");
    }
    try {
        const jwt = parseJwt(id_token);
        if (nonce !== jwt.payload.nonce) {
            throw new Error(`Invalid nonce in id_token: ${jwt.payload.nonce}`);
        }
        validateJwt(id_token, options, true);
        // @ts-ignore
        if (!jwt.payload["sub"]) {
            throw new Error("No Subject (sub) present in id_token");
        }
        return jwt.payload;
    } catch (e) {
        throw new InvalidIdTokenError(e.message);
    }
}
function validateJwt(jwt, options, isIdToken = false) {
    // eslint-disable-next-line prefer-const
    let { clockSkew, currentTimeInMillis, issuer, audience, client_id } = options;
    if (!clockSkew) {
        clockSkew = 0;
    }
    const now = ((currentTimeInMillis === null || currentTimeInMillis === void 0 ? void 0 : currentTimeInMillis()) || Date.now()) / 1000;
    const payload = parseJwt(jwt).payload;
    if (!payload.iss) {
        throw new InvalidJWTError("Issuer (iss) was not provided");
    }
    if (payload.iss !== issuer) {
        throw new InvalidJWTError(`Invalid Issuer (iss) in token: ${payload.iss}`);
    }
    if (!payload.aud) {
        throw new InvalidJWTError("Audience (aud) was not provided");
    }
    // Audience must be equal to client_id in id_token
    // https://openid.net/specs/openid-connect-core-1_0.html#IDToken
    if (Array.isArray(payload.aud) ? payload.aud.indexOf(isIdToken ? client_id : audience || client_id) === -1 : payload.aud !== (isIdToken ? client_id : audience || client_id)) {
        throw new InvalidJWTError(`Invalid Audience (aud) in token: ${payload.aud}`);
    }
    if (payload.azp && payload.azp !== client_id) {
        throw new InvalidJWTError(`Invalid Authorized Party (azp) in token: ${payload.azp}`);
    }
    const lowerNow = Math.ceil(now + clockSkew);
    const upperNow = Math.floor(now - clockSkew);
    if (!payload.iat) {
        throw new InvalidJWTError("Issued At (iat) was not provided");
    }
    if (lowerNow < Number(payload.iat)) {
        throw new InvalidJWTError(`Issued At (iat) is in the future: ${payload.iat}`);
    }
    if (payload.nbf && lowerNow < Number(payload.nbf)) {
        throw new InvalidJWTError(`Not Before time (nbf) is in the future: ${payload.nbf}`);
    }
    if (!payload.exp) {
        throw new InvalidJWTError("Expiration Time (exp) was not provided");
    }
    if (Number(payload.exp) < upperNow) {
        throw new InvalidJWTError(`Expiration Time (exp) is in the past: ${payload.exp}`);
    }
    return payload;
}
// Retrieved from https://www.iana.org/assignments/jwt/jwt.xhtml
const nonUserClaims = [
    "iss",
    // 'sub',
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

const DEFAULT_CHECK_INTERVAL = 2000;
function createSessionCheckerFrame(options) {
    const { url, callback, client_id, checkInterval } = options;
    let internalSessionState;
    const idx = url.indexOf("/", url.indexOf("//") + 2);
    const frameOrigin = url.substr(0, idx);
    const frame = createHiddenFrame();
    let timer;
    const load = ()=>{
        return new Promise((resolve)=>{
            window.document.body.appendChild(frame);
            window.addEventListener("message", iframeEventHandler, false);
            frame.onload = ()=>{
                resolve(null);
            };
        });
    };
    const start = (sessionState)=>{
        load().then(()=>{
            if (sessionState && internalSessionState !== sessionState) {
                stop();
                internalSessionState = sessionState;
                const send = ()=>{
                    frame.contentWindow.postMessage(`${client_id} ${internalSessionState}`, frameOrigin);
                };
                send();
                timer = window.setInterval(send, checkInterval || DEFAULT_CHECK_INTERVAL);
            }
        });
    };
    const stop = ()=>{
        internalSessionState = null;
        if (timer) {
            window.clearInterval(timer);
            timer = null;
        }
    };
    const iframeEventHandler = (e)=>{
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

/**
 * not suitable for every object but it is enough for this library
 * @param object
 */ function cleanUndefined(object) {
    if (!object || typeof object !== "object") {
        return object;
    }
    return JSON.parse(JSON.stringify(object));
}
function merge(previousValue, currentValue) {
    for(const p in currentValue){
        if (currentValue[p] !== undefined) {
            if (typeof currentValue[p] === "object" && currentValue[p].constructor.name === "Object") {
                previousValue[p] = merge(previousValue[p] || {}, currentValue[p]);
            } else {
                previousValue[p] = currentValue[p];
            }
        }
    }
    return previousValue;
}
function mergeObjects(...objects) {
    return objects.reduce((previousValue, currentValue)=>{
        return merge(previousValue || {}, currentValue);
    }, {});
}

const isResponseType = (type, response_type)=>response_type && response_type.split(/\s+/g).filter((rt)=>rt === type).length > 0;
const isScopeIncluded = (scope, scopes)=>scopes && scopes.split(" ").indexOf(scope) > -1;

const openPopup = (url, width = 400, height = 600)=>{
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    return window.open(url, "oidc-login-popup", `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`);
};
function runPopup(url, options) {
    let popup = options.popup;
    if (popup) {
        popup.location.href = url;
    } else {
        popup = openPopup(url);
    }
    if (!popup) {
        /* istanbul ignore next */ throw new Error("Could not open popup");
    }
    let timeoutId;
    let closeId;
    return new Promise((resolve, reject)=>{
        function clearHandlers() {
            clearInterval(closeId);
            clearTimeout(timeoutId);
            window.removeEventListener("message", messageListener);
        }
        const timeoutMs = (options.timeout || 60) * 1000;
        timeoutId = setTimeout(()=>{
            clearHandlers();
            reject(new OIDCClientError("Timed out"));
        }, timeoutMs);
        closeId = setInterval(()=>{
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

/*
Jitbit TabUtils - helper for multiple browser tabs. version 1.0
https://github.com/jitbit/TabUtils
- executing "interlocked" function call - only once per multiple tabs
- broadcasting a message to all tabs (including the current one) with some message "data"
- handling a broadcasted message
MIT license: https://github.com/jitbit/TabUtils/blob/master/LICENSE
*/ function _define_property$1(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
const currentTabId = `${performance.now()}:${Math.random() * 1000000000 | 0}`;
const handlers = {};
class TabUtils {
    //runs code only once in multiple tabs
    //the lock holds for 4 seconds (in case the function is async and returns right away, for example, an ajax call intiated)
    //then it is cleared
    CallOnce(lockname, fn, timeout = 3000) {
        if (!lockname) throw "empty lockname";
        if (!window.localStorage) {
            //no local storage. old browser. screw it, just run the function
            fn();
            return;
        }
        const localStorageKey = this.keyPrefix + lockname;
        localStorage.setItem(localStorageKey, currentTabId);
        //re-read after a delay (after all tabs have saved their tabIDs into ls)
        setTimeout(()=>{
            if (localStorage.getItem(localStorageKey) === currentTabId) fn();
        }, 150);
        //cleanup - release the lock after 3 seconds and on window unload (just in case user closed the window while the lock is still held)
        setTimeout(()=>{
            localStorage.removeItem(localStorageKey);
        }, timeout);
    }
    BroadcastMessageToAllTabs(messageId, eventData) {
        //now we also need to manually execute handler in the current tab too, because current tab does not get 'storage' events
        try {
            handlers[messageId](eventData);
        } catch (x) {
        //"try" in case handler not found
        }
        if (!window.localStorage) {
            this.events.emit(messageId, eventData);
            return; //no local storage. old browser
        }
        const data = {
            data: eventData,
            timeStamp: new Date().getTime()
        } //add timestamp because overwriting same data does not trigger the event
        ;
        //this triggers 'storage' event for all other tabs except the current tab
        localStorage.setItem(`${this.keyPrefix}event${messageId}`, JSON.stringify(data));
        //cleanup
        setTimeout(()=>{
            localStorage.removeItem(`${this.keyPrefix}event${messageId}`);
        }, 3000);
    }
    OnBroadcastMessage(messageId, fn) {
        handlers[messageId] = fn;
        if (!window.localStorage) {
            this.events.on(messageId, fn);
            return; //no local storage. old browser
        }
        //first register a handler for "storage" event that we trigger above
        window.addEventListener("storage", (ev)=>{
            if (ev.key !== `${this.keyPrefix}event${messageId}`) return; // ignore other keys
            if (!ev.newValue) return; //called by cleanup?
            const messageData = JSON.parse(ev.newValue);
            fn(messageData.data);
        });
    }
    constructor(kid, fallbackEvents){
        _define_property$1(this, "keyPrefix", void 0);
        _define_property$1(this, "events", void 0);
        this.keyPrefix = kid;
        this.events = fallbackEvents;
    }
}

function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
/**
 * `OIDCClient` provides methods for interacting with OIDC/OAuth2 authorization server. Those methods are signing a
 * user in, signing out, managing the user's claims, checking session and managing tokens returned from the
 * OIDC/OAuth2 provider.
 *
 */ class OIDCClient extends EventEmitter {
    /**
   * Initialize the library with this method. It resolves issuer configuration, jwks keys which are necessary for
   * validating tokens returned from provider and checking if a user is already authenticated in provider.
   *
   * @param checkLogin Make this `false` if you don't want to check user authorization status in provider while
   * initializing. Defaults to `true`
   */ async initialize(checkLogin = true) {
        if (this.initialized) {
            return this;
        }
        if (this.__initializePromise) {
            return this.__initializePromise;
        }
        this.__initializePromise = new Promise(async (resolve, reject)=>{
            try {
                if (this.stateStore.init) {
                    await this.stateStore.init();
                }
                if (this.authStore.init) {
                    await this.authStore.init();
                }
                if (!this.options.endpoints || Object.keys(this.options.endpoints).length === 0) {
                    await this.fetchFromIssuer();
                }
                this.initialized = true;
                if (checkLogin) {
                    try {
                        var _window;
                        if (!((_window = window) === null || _window === void 0 ? void 0 : _window.frameElement)) {
                            await this.silentLogin();
                        }
                    } catch (e) {
                        this.emit(Events.SILENT_RENEW_ERROR, e);
                        await this.authStore.clear();
                    }
                } else {
                    const localAuth = await this.authStore.get("auth");
                    if (localAuth) {
                        await this.onUserLogin(localAuth, true);
                    }
                }
                resolve(this);
            } catch (e) {
                if (e instanceof OIDCClientError) {
                    reject(e);
                } else {
                    reject(new OIDCClientError(e.message));
                }
            } finally{
                this.__initializePromise = undefined;
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
   */ async login(options = {}, localState = {}) {
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
   */ async loginWithPopup(options = {}, popupOptions = {}) {
        const url = await this.createAuthRequest({
            response_mode: "fragment",
            ...options,
            display: "popup",
            request_type: "p"
        });
        const { response, state } = await runPopup(url, popupOptions);
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
   */ async loginCallback(url = (()=>{
        var _window_location, _window;
        return (_window = window) === null || _window === void 0 ? void 0 : (_window_location = _window.location) === null || _window_location === void 0 ? void 0 : _window_location.href;
    })()) {
        if (!url) {
            return Promise.reject(new OIDCClientError("Url must be passed to handle login redirect"));
        }
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return Promise.reject(new OIDCClientError(`Invalid callback url passed: "${url}"`));
        }
        const responseParams = parseQueryUrl(parsedUrl.search || parsedUrl.hash);
        const rawStoredState = await this.loadState(responseParams.state);
        const { authParams, localState, request_type } = rawStoredState;
        url = url || window.location.href;
        switch(request_type){
            case "s":
                var _window;
                if ((_window = window) === null || _window === void 0 ? void 0 : _window.frameElement) {
                    if (url) {
                        window.parent.postMessage({
                            type: "authorization_response",
                            response: responseParams,
                            state: rawStoredState
                        }, `${location.protocol}//${location.host}`);
                    }
                }
                return;
            case "p":
                if (window.opener && url) {
                    window.opener.postMessage({
                        type: "authorization_response",
                        response: responseParams,
                        state: rawStoredState
                    }, `${location.protocol}//${location.host}`);
                }
                return;
            default:
                {
                    if (responseParams.error) {
                        return Promise.reject(new AuthenticationError(responseParams.error, responseParams.error_description));
                    }
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
   */ async logout(options = {}) {
        if (!options.localOnly) {
            const storedAuth = await this.authStore.get("auth");
            const id_token_hint = options.id_token_hint || (storedAuth === null || storedAuth === void 0 ? void 0 : storedAuth.id_token_raw);
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
   */ async revokeToken(token, type = "access_token", options = {}) {
        if (!this.options.endpoints.revocation_endpoint) {
            return Promise.reject(new OIDCClientError('"revocation_endpoint" doesn\'t exist'));
        }
        const finalOptions = {
            client_id: options.client_id || this.options.client_id,
            client_secret: options.client_secret || this.options.client_secret,
            token_type_hint: type,
            token: token
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
   */ async silentLogin(options = {}, localState = {}) {
        await this.initialize(false);
        let tokenResult;
        let finalState = {};
        const storedAuth = await this.authStore.get("auth") || {};
        const finalOptions = mergeObjects({
            response_mode: "query",
            display: "page",
            prompt: "none"
        }, this.options, options);
        if (finalOptions.silent_redirect_uri) {
            finalOptions.redirect_uri = finalOptions.silent_redirect_uri;
        }
        if (this.options.useRefreshToken && (storedAuth === null || storedAuth === void 0 ? void 0 : storedAuth.refresh_token)) {
            finalState.authParams = mergeObjects((storedAuth === null || storedAuth === void 0 ? void 0 : storedAuth.authParams) || {}, finalState.authParams || {});
            tokenResult = await this.exchangeRefreshToken({
                ...finalOptions,
                refresh_token: storedAuth.refresh_token
            });
        } else {
            const authUrl = await this.createAuthRequest({
                ...finalOptions,
                request_type: "s"
            }, localState);
            const { response, state } = await runIframe(authUrl, {
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
   */ async getAccessToken() {
        var _this;
        return (_this = await this.authStore.get("auth")) === null || _this === void 0 ? void 0 : _this.access_token;
    }
    /**
   * Retrieve logged in user's refresh token if it exists.
   */ async getRefreshToken() {
        var _this;
        return (_this = await this.authStore.get("auth")) === null || _this === void 0 ? void 0 : _this.refresh_token;
    }
    /**
   * Retrieve logged in user's parsed id token if it exists.
   */ async getIdToken() {
        var _this;
        return (_this = await this.authStore.get("auth")) === null || _this === void 0 ? void 0 : _this.id_token;
    }
    /**
   * Retrieve access token's expiration.
   */ async getExpiresIn() {
        var _this;
        return (_this = await this.authStore.get("auth")) === null || _this === void 0 ? void 0 : _this.expires_in;
    }
    /**
   * Retrieve logged in user's id token in raw format if it exists.
   */ async getIdTokenRaw() {
        var _this;
        return (_this = await this.authStore.get("auth")) === null || _this === void 0 ? void 0 : _this.id_token_raw;
    }
    /**
   * Retrieve logged in user's scopes if it exists.
   */ async getScopes() {
        var _scope, _this;
        return (_this = await this.authStore.get("auth")) === null || _this === void 0 ? void 0 : (_scope = _this.scope) === null || _scope === void 0 ? void 0 : _scope.split(" ").filter(Boolean);
    }
    /**
   * Retrieve logged in user's profile.
   */ async getUser() {
        var _this;
        return (_this = await this.authStore.get("auth")) === null || _this === void 0 ? void 0 : _this.user;
    }
    /**
   * If there is a user stored locally return true. Otherwise it will make a silentLogin to check if End-User is
   * logged in provider.
   *
   * @param localOnly Don't check provider
   */ async isLoggedIn(localOnly = false) {
        const existsOnLocal = !!await this.getUser();
        if (!existsOnLocal && !localOnly) {
            try {
                await this.silentLogin();
                return true;
            } catch (e) {
                return false;
            }
        }
        return existsOnLocal;
    }
    /**
   * Create authorization request with provided options.
   *
   * @param options
   * @param localState
   * @private
   */ async createAuthRequest(options = {}, localState = {}) {
        var _this_options_endpoints, _this_options_currentTimeInMillis, _this_options;
        if (!((_this_options_endpoints = this.options.endpoints) === null || _this_options_endpoints === void 0 ? void 0 : _this_options_endpoints.authorization_endpoint)) {
            await this.initialize(false);
        }
        // TODO: deep merge for extra params
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
        if (!authParams.nonce && (isResponseType("id_token", authParams.response_type) || isScopeIncluded("openid", authParams.scope))) {
            authParams.nonce = generateRandom(finalOptions.nonceLength);
        }
        if (isResponseType("code", authParams.response_type)) {
            authParams.code_challenge = await deriveChallenge(localState.code_verifier);
            authParams.code_challenge_method = finalOptions.code_challenge_method || "S256";
        }
        const now = ((_this_options_currentTimeInMillis = (_this_options = this.options).currentTimeInMillis) === null || _this_options_currentTimeInMillis === void 0 ? void 0 : _this_options_currentTimeInMillis.call(_this_options)) || Date.now();
        const fragment = finalOptions.fragment ? `#${finalOptions.fragment}` : "";
        const authParamsString = buildEncodedQueryString(authParams);
        const url = `${this.options.endpoints.authorization_endpoint}${authParamsString}${fragment}`;
        // clear 1 day old state entries
        this.stateStore.clear(now - 86400000);
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
   */ async createLogoutRequest(options = {}) {
        var _this_options_endpoints;
        if (!((_this_options_endpoints = this.options.endpoints) === null || _this_options_endpoints === void 0 ? void 0 : _this_options_endpoints.end_session_endpoint)) {
            await this.fetchFromIssuer();
        }
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
   */ async exchangeAuthorizationCode(options) {
        var _this_options_endpoints;
        if (!((_this_options_endpoints = this.options.endpoints) === null || _this_options_endpoints === void 0 ? void 0 : _this_options_endpoints.token_endpoint)) {
            await this.fetchFromIssuer();
        }
        const finalOptions = mergeObjects(this.options, options);
        const { extraTokenHeaders, extraTokenParams, ...rest } = finalOptions;
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
        ]){
            if (!mergedOptions[req]) {
                return Promise.reject(new Error(`"${req}" is required`));
            }
        }
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
   */ async exchangeRefreshToken(options) {
        var _this_options_endpoints;
        if (!((_this_options_endpoints = this.options.endpoints) === null || _this_options_endpoints === void 0 ? void 0 : _this_options_endpoints.token_endpoint)) {
            await this.fetchFromIssuer();
        }
        const { extraTokenHeaders, extraTokenParams, ...rest } = options;
        const mergedOptions = {
            grant_type: "refresh_token",
            client_id: this.options.client_id,
            client_secret: this.options.client_secret,
            ...rest,
            ...extraTokenParams || {}
        };
        for (const req of [
            "refresh_token",
            "client_id"
        ]){
            if (!mergedOptions[req]) {
                return Promise.reject(new Error(`"${req}" is required`));
            }
        }
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
   */ async fetchFromIssuer() {
        try {
            const requestUrl = `${this.options.issuer}/.well-known/openid-configuration`;
            const response = await this.http({
                url: requestUrl,
                method: "GET",
                requestType: "json"
            });
            this.issuer_metadata = response;
            const endpoints = {};
            for (const prop of Object.keys(this.issuer_metadata)){
                if (prop.endsWith("_endpoint") || prop.indexOf("_session") > -1 || prop.indexOf("_uri") > -1) {
                    endpoints[prop] = this.issuer_metadata[prop];
                }
            }
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
   */ async handleAuthResponse(response, finalOptions, localState = {}) {
        if (response.code) {
            return this.exchangeAuthorizationCode({
                redirect_uri: finalOptions.redirect_uri,
                client_id: finalOptions.client_id,
                code_verifier: localState.code_verifier,
                grant_type: "authorization_code",
                code: response.code
            });
        }
        return response;
    }
    /**
   * Handle OAuth2 auth request result
   * @param tokenResult
   * @param authParams
   * @param finalOptions
   * @private
   */ async handleTokenResult(tokenResult, authParams, finalOptions) {
        await this.initialize(false);
        let user = {};
        if (tokenResult.error) {
            throw new AuthenticationError(tokenResult.error, tokenResult.error_description);
        }
        let parsedIDToken;
        if (tokenResult.id_token) {
            parsedIDToken = await validateIdToken(tokenResult.id_token, authParams.nonce, finalOptions);
            if (finalOptions.idTokenValidator && !await finalOptions.idTokenValidator(tokenResult.id_token)) {
                return Promise.reject(new InvalidIdTokenError("Id Token validation failed"));
            }
            Object.keys(parsedIDToken).forEach((key)=>{
                if (!nonUserClaims.includes(key)) {
                    user[key] = parsedIDToken[key];
                }
            });
        }
        if (tokenResult.access_token) {
            var _this_options_endpoints;
            if (finalOptions.requestUserInfo && ((_this_options_endpoints = this.options.endpoints) === null || _this_options_endpoints === void 0 ? void 0 : _this_options_endpoints.userinfo_endpoint)) {
                const userInfoResult = await this.fetchUserInfo(tokenResult.access_token);
                if (!userInfoResult.error) {
                    user = {
                        ...user,
                        ...userInfoResult
                    };
                }
            }
        }
        return {
            authParams,
            user,
            ...tokenResult,
            id_token: parsedIDToken,
            id_token_raw: tokenResult.id_token,
            scope: tokenResult.scope !== undefined ? tokenResult.scope : authParams.scope
        };
    }
    /**
   * Load stored state
   *
   * @param state
   * @private
   */ async loadState(state) {
        const rawStoredState = await this.stateStore.get(state);
        if (!rawStoredState) {
            return Promise.reject(new StateNotFound("Local state not found", state));
        }
        await this.stateStore.del(state);
        return rawStoredState;
    }
    /**
   * Load user info by making request to providers `userinfo_endpoint`
   *
   * @param accessToken
   * @private
   */ async fetchUserInfo(accessToken) {
        return this.http({
            method: "GET",
            url: `${this.options.endpoints.userinfo_endpoint}`,
            requestType: "json",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    }
    /**
   * Start monitoring End-User's session if the OIDC provider supports session management. See more at [OIDC Session
   * Management](https://openid.net/specs/openid-connect-session-1_0.html)
   *
   * @param sub End-User's id to for monitoring session
   * @param session_state string that represents the End-User's login state at the OP
   */ monitorSession({ sub, session_state }) {
        const { client_id, endpoints } = this.options;
        if (!(endpoints === null || endpoints === void 0 ? void 0 : endpoints.check_session_iframe)) {
            console.warn('"check_session_iframe" endpoint missing or session management is not supported by provider');
            return;
        }
        if (!this.sessionCheckerFrame) {
            const sessionCheckCallback = async (err)=>{
                if (err) {
                    this.emit(Events.USER_LOGOUT);
                } else {
                    this.emit(Events.SESSION_CHANGE);
                    try {
                        await this.silentLogin({}, {});
                        const storedAuth = await this.authStore.get("auth");
                        if (storedAuth) {
                            var _storedAuth_user;
                            if (((_storedAuth_user = storedAuth.user) === null || _storedAuth_user === void 0 ? void 0 : _storedAuth_user.sub) === sub && storedAuth.session_state) {
                                this.sessionCheckerFrame.start(storedAuth.session_state);
                            }
                        } else {
                            this.emit(Events.USER_LOGOUT, null);
                        }
                    } catch (e) {
                        this.emit(Events.USER_LOGOUT);
                        return;
                    }
                }
            };
            this.sessionCheckerFrame = createSessionCheckerFrame({
                url: endpoints.check_session_iframe,
                client_id: client_id,
                callback: sessionCheckCallback,
                checkInterval: this.options.checkSessionInterval
            });
        }
        this.sessionCheckerFrame.start(session_state);
    }
    async onUserLogin(authObj, isInternal = false) {
        var _window;
        const { expires_in, user, scope, access_token, id_token, refresh_token, session_state, id_token_raw } = authObj;
        await this.authStore.set("auth", authObj);
        this.user = user;
        this.scopes = scope === null || scope === void 0 ? void 0 : scope.split(" ").filter(Boolean);
        this.accessToken = access_token;
        this.idToken = id_token;
        this.idTokenRaw = id_token_raw;
        this.refreshToken = refresh_token;
        if (!isInternal) {
            this.emit(Events.USER_LOGIN, authObj);
        }
        if (!((_window = window) === null || _window === void 0 ? void 0 : _window.frameElement)) {
            if (this.options.checkSession) {
                this.monitorSession({
                    sub: user.sub || user.id,
                    session_state
                });
            }
            if (expires_in !== undefined && this.options.autoSilentRenew) {
                const expiration = Number(expires_in) - this.options.secondsToRefreshAccessTokenBeforeExp;
                const renew = ()=>{
                    this.synchronizer.CallOnce("silent-login", async ()=>{
                        try {
                            await this.silentLogin();
                            this.emit(Events.SILENT_RENEW_SUCCESS, null);
                        } catch (e) {
                            this.emit(Events.SILENT_RENEW_ERROR, e);
                        }
                    });
                };
                if (expiration >= 0) {
                    this._accessTokenExpireTimer.start(expiration, async ()=>{
                        renew();
                    });
                } else {
                    renew();
                }
            }
        }
    }
    constructor(options){
        super(), _define_property(this, "options", void 0), _define_property(this, "user", void 0), _define_property(this, "scopes", void 0), _define_property(this, "accessToken", void 0), _define_property(this, "refreshToken", void 0), _define_property(this, "idToken", void 0), _define_property(this, "idTokenRaw", void 0), _define_property(this, "issuer_metadata", void 0), _define_property(this, "http", void 0), _define_property(this, "synchronizer", void 0), _define_property(this, "stateStore", void 0), _define_property(this, "authStore", void 0), _define_property(this, "sessionCheckerFrame", void 0), _define_property(this, "_accessTokenExpireTimer", void 0), _define_property(this, "initialized", void 0), _define_property(this, "__initializePromise", void 0);
        if (!isValidIssuer(options.issuer)) {
            throw new OIDCClientError('"issuer" must be a valid uri.');
        }
        this.synchronizer = new TabUtils(btoa(options.issuer), this);
        this.options = mergeObjects({
            secondsToRefreshAccessTokenBeforeExp: 60,
            autoSilentRenew: true,
            checkSession: true,
            stateLength: 10,
            nonceLength: 10
        }, options, {
            // remove last slash for consistency across the lib
            issuer: options.issuer.endsWith("/") ? options.issuer.slice(0, -1) : options.issuer
        });
        this.http = this.options.httpClient || request;
        this.stateStore = this.options.stateStore || new LocalStorageStateStore("pa_oidc.state.");
        this.authStore = this.options.authStore || new InMemoryStateStore();
        if (this.options.autoSilentRenew) {
            this._accessTokenExpireTimer = new Timer();
        }
        this.on(Events.USER_LOGOUT, async ()=>{
            this.user = undefined;
            this.scopes = undefined;
            this.accessToken = undefined;
            this.idToken = undefined;
            this.refreshToken = undefined;
            await this.authStore.clear();
        });
        this.synchronizer.OnBroadcastMessage(Events.USER_LOGIN, this.onUserLogin.bind(this));
    }
}

/**
 * Create OIDC client with initializing it. It resolves issuer metadata, jwks keys and check if user is
 * authenticated in OpenId Connect provider.
 */ function createOIDCClient(options) {
    return new OIDCClient(options).initialize();
}

export { AuthenticationError, EventEmitter, Events, InMemoryStateStore, InteractionCancelled, InvalidIdTokenError, InvalidJWTError, LocalStorageStateStore, OIDCClient, OIDCClientError, StateNotFound, StateStore, createOIDCClient as default };
//# sourceMappingURL=oidc-client.esm.js.map
