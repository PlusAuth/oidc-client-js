## @plusauth/oidc-client-js

<a href="https://github.com/PlusAuth/oidc-client-js/actions?query=workflow%3Aci">
<img src="https://github.com/PlusAuth/oidc-client-js/workflows/ci/badge.svg" alt="Build Status">
</a>
<a href="https://www.npmjs.com/package/@plusauth/oidc-client-js">
<img alt="npm" src="https://img.shields.io/npm/v/@plusauth/oidc-client-js?label=latest%20&logo=npm&style=flat">
</a>
<a href="https://www.npmjs.com/package/@plusauth/oidc-client-js">
<img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/min/@plusauth/oidc-client-js@latest?label=minified%20size&style=flat">
</a>
<a href="https://www.npmjs.com/package/@plusauth/oidc-client-js">
<img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@plusauth/oidc-client-js@latest?color=darkgreen&label=minzipped%20size&style=flat">
</a>
<a href="https://codecov.io/gh/PlusAuth/oidc-client-js">
<img alt="Codecov" src="https://img.shields.io/codecov/c/gh/PlusAuth/oidc-client-js?logo=codecov&style=flat">
</a>
<a href="https://snyk.io/test/github/PlusAuth/oidc-client-js">
<img src="https://img.shields.io/snyk/vulnerabilities/github/PlusAuth/oidc-client-js?style=flat" alt="Vulnerabilities">
</a>
<a href="https://github.com/PlusAuth/oidc-client-js/blob/master/LICENSE">
<img alt="license" src="https://img.shields.io/npm/l/@plusauth/oidc-client-js?style=flat">
</a>

OpenID Connect (OIDC) and OAuth2 library for browser based JavaScript applications.

### Features
- Silent Authentication
- Automatic Access Token Renewal
- [OAuth 2.0 Token Revocation](http://tools.ietf.org/html/rfc7009)
- [Session Management](https://openid.net/specs/openid-connect-session-1_0.html) (with logout functionality)
- [PKCE](https://tools.ietf.org/html/rfc7636)
- JWT payload validation
- Can be used with any OAuth 2.0 / OpenID Connect provider
- Cross tab/window login synchronization
- Dispatches single request per tab/window to prevent inconsistency
- Official TypeScript support

### Table of Contents
- [Installation](#installation)
- [Documentation](#documentation)
- [Access Token Refreshing](#automatically-renew-access-token)
- [Use Refresh Token](#use-refresh-tokens-for-access-token-renewal)
- [Login with Popup](#login-with-popup)
- [Additional Methods](#additional-methods)
- [Examples](/examples)

## Installation
From the CDN:

```html
<script src="https://unpkg.com/@plusauth/oidc-client-js@1.5.0/dist/oidc-client.min.js"></script>
```

Using package managers:
```bash
npm install @plusauth/oidc-client-js
yarn add @plusauth/oidc-client-js
pnpm add @plusauth/oidc-client-js
```

## Documentation

### Initialization
Create the `OIDCClient` instance before rendering or initializing your application.

```js
import { OIDCClient } from '@plusauth/oidc-client-js';

const oidcClient = new OIDCClient({
  issuer: 'YOUR_OIDC_PROVIDER',
  client_id: 'YOUR_CLIENT_ID',
  redirect_uri: 'YOUR_CALLBACK_PAGE_URI'
});

oidcClient.initialize().then( function(){
  // client initialized
})
```

Or with create helper method:

```js
import createOIDCClient from '@plusauth/oidc-client-js';

createOIDCClient({
  issuer: 'YOUR_OIDC_PROVIDER',
  client_id: 'YOUR_CLIENT_ID',
  redirect_uri: 'YOUR_CALLBACK_PAGE_URI'
}).then(oidcClient => {
  //...
});
```

Using `createOIDCClient` does a couple of things automatically:

* It creates an instance of `OIDCClient`.
* It calls `silentLogin` to refresh the user session.
* It suppresses all errors from `silentLogin`.

### Create callback page
OpenID Connect / OAuth2 authorization flows require a redirect uri to return the authorization result back. Create a
page and register its url to your client's allowed redirect uris. In your page initialize OIDCClient and all you
need to do is call `loginCallback` method.

```js
oidcClient.loginCallback()
.then( function(localState){
  // successful login
  console.log('User successfully logged in')
})
.catch( function(error) {
  console.error('Authorization error:', error)
 })
```

### Login and get user info

Create a login button users can click.

```html
<button id="login">Login</button>
```

In the click event handler of button you created, call login method for redirecting user to provider's login page
. Make sure `redirect_uri` is registered on the provider, and you have created a callback handler as defined in [above
](#create-callback-page).

```js
document.getElementById('login').addEventListener('click', function() {
  oidcClient.login({
    redirect_uri: 'http://localhost:8080/'
  });
});
```


### Make authenticated requests to your API

After user is successfully logged in we can use access_token retrieved from authentication response to call the API.

```html
<button id="makeRequest">Make Request</button>
```

On the event handler you can get access token and use it like this:

```js
document.getElementById('makeRequest').addEventListener('click', function () {
 oidcClient.getAccessToken().then(accessToken =>
       fetch('https://any.exampleapi.com/api', {
         method: 'GET',
         headers: {
           Authorization: 'Bearer ' + accessToken
         }
       })
     )
     .then(result => result.json())
     .then(data => {
       console.log(data);
     });
});
```

### Logout

Add a logout button.

```html
<button id="logout">Logout</button>
```

In event handler, call equivalent method.
```js
document.getElementById('logout').addEventListener('click', function(){
  oidcClient.logout();
});
```

## Automatically renew access token
Generally, access tokens have a short lifetime, so it is common to renew the access token before its expiration.
This feature is enabled by default, but you can disable it by passing `autoSilentRenew: false` to client options.

```js
new OIDCClient({
  autoSilentRenew: false,
  ...// other options
})
```

### Use different callback page for silent renew
In silent renew the library performs the flow in a hidden iframe. When you are developing a single page application,
assuming your callback page is handled by the app itself, the iframe will load your whole application after the
oauth2 redirection.

You can prevent this overhead by creating a different page which will handle silent renew only. To accomplish this you
should pass `silent_redirect_uri` to client options which should have your silent redirect handler page uri. If you don't use
`silent_redirect_uri`, `redirect_uri` will be used instead. Don't forget to include it to your providers redirect uri whitelist.

Have a look at following snippets for an example:
```js
// auth.js
import { OIDCClient } from '@plusauth/oidc-client-js';

const oidcClient = new OIDCClient({
  redirect_uri: 'https://YOUR_SITE/callback'
  silent_redirect_uri: 'https://YOUR_SITE/silent-renew.html',
  ...//other options
});
```



```html
<!-- silent-renew.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/@plusauth/oidc-client-js/dist/plusauth-oidc-client.umd.js"></script>
</head>
<body>
<script type="application/javascript" >
    new PlusAuthOIDCClient.OIDCClient({
      issuer: 'YOUR_OIDC_PROVIDER'
    }).loginCallback()
</script>
</body>
</html>
```

## Use Refresh Tokens for access token renewal
Configure the library by passing the setting `useRefreshTokens` to `true` on initialization:

```js
const oidcClient = new OIDCClient({
  issuer: 'YOUR_OIDC_ISSUER',
  client_id: 'YOUR_CLIENT-ID',
  useRefreshTokens: true
});
```


<div class="custom-block alert info">
  <div class="custom-block-body">
    <p>

Don't forget to include `offline_access` in your scope for retrieving refresh tokens. If there is not any refresh
token stored locally, the library will fallback to using silent authorization request.
</p>
  </div>
</div>

## Login with popup

Create a button to trigger login.

```html
<button id="loginWithPopup">Login</button>
```

Attach event listener and call `loginWithPopup` method of your initialized oidc client.

```js
document.getElementById('loginWithPopup').click(async () => {
  await oidcClient.loginWithPopup();
});
```

<div class="custom-block alert warning">
  <div class="custom-block-body">
    <p>
Most browsers block popups if they are not happened as a result of user actions. In order to display
login popup you must call `loginWithPopup` in an event handler listening for a user action like button click.
    </p>
  </div>
</div>

## Additional methods
You can access user, access token, refresh token, id token and scopes with followings. Using getter methods are always the
safe bet as they will read from store. Direct access of those variables may result unexpectedly if you modify them in your app.
Direct variables are created by listening the `user_login` and `user_logout` events.

### Get User

```js
  const user = await oidcClient.getUser();
  // or
  const user = oidcClient.user
```

### Get Access Token

```js
  const accessToken = await oidcClient.getAccessToken();
  // or
  const accessToken = oidcClient.accessToken
```

### Get ID Token

```js
  const idToken = await oidcClient.getIdToken();
  // or
  const idToken = oidcClient.idToken
```

### Get Refresh Token

```js
  const refreshToken = await oidcClient.getRefreshToken();
  // or
  const refreshToken = oidcClient.refreshToken
```

### Get Scopes

```js
  const scopes = await oidcClient.getScopes();
  // or
  const scopes = oidcClient.scopes
```


## Api Docs
Please visit [here](https://plusauth.github.io/oidc-client-js/classes/OIDCClient.html)

## Examples
Have a look at [examples directory](/examples) for various examples

### Browser Support
[Browserlist Coverage](https://browsersl.ist/#q=defaults)

This library uses global fetch api. If your app requires to be working in environment that does not have `fetch`
you must use a polyfill like [whatwg-fetch](https://github.com/github/fetch).

