## @plusauth/oidc-client-js

<a href="https://github.com/PlusAuth/oidc-client-js/actions?query=workflow%3Aci">
<img src="https://github.com/PlusAuth/oidc-client-js/workflows/ci/badge.svg" alt="Build Status">
</a>
<a href="https://www.npmjs.com/package/@plusauth/oidc-client-js">
<img alt="npm" src="https://img.shields.io/npm/v/@plusauth/oidc-client-js?label=latest%20&logo=npm&style=flat-square">
</a>
<a href="https://www.npmjs.com/package/@plusauth/oidc-client-js">
<img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/min/@plusauth/oidc-client-js@latest?label=minified%20size&style=flat-square">
</a>
<a href="https://www.npmjs.com/package/@plusauth/oidc-client-js">
<img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@plusauth/oidc-client-js@latest?color=darkgreen&label=minzipped%20size&style=flat-square">
</a>
<a href="https://codecov.io/gh/PlusAuth/oidc-client-js">
<img alt="Codecov" src="https://img.shields.io/codecov/c/gh/PlusAuth/oidc-client-js?logo=codecov&style=flat-square">
</a>
<a href="https://snyk.io/test/github/PlusAuth/oidc-client-js">
<img src="https://img.shields.io/snyk/vulnerabilities/github/PlusAuth/oidc-client-js?style=flat-square" alt="Vulnerabilities">
</a>
<a href="https://github.com/PlusAuth/oidc-client-js/blob/master/LICENSE">
<img alt="license" src="https://img.shields.io/npm/l/@plusauth/oidc-client-js?style=flat-square">
</a>

OpenID Connect (OIDC) and OAuth2 library for browser based JavaScript applications.

### Features
- Silent Authentication
- Automatic Access Token Renewal
- [OAuth 2.0 Token Revocation](http://tools.ietf.org/html/rfc7009)
- [Session Management](https://openid.net/specs/openid-connect-session-1_0.html) (with logout functionality)
- [PKCE](https://tools.ietf.org/html/rfc7636)
- JWT payload validation
- Can be used with any OpenID Connect provider
- Cross tab/window login synchronization
- Dispatches single request per tab/window to prevent inconsistency
- Official TypeScript support

### Table of Contents
- [Installation](#installation)
- [Documentation](#documentation)
- [Api Docs](#api-docs)
- [Examples](#examples)


### Installation

From the CDN:

> **⚠ NOTE:** We advise using specific versions in CDN links as fetching latest version may break up your application.
> Make sure to check releases and use the specific version.

```html
<script src="https://unpkg.com/@plusauth/oidc-client-js@1.0.0/dist/plusauth-oidc-client.umd.js"></script>
```

Using [npm](https://npmjs.org):

```sh
npm install @plusauth/oidc-client-js
```

or [yarn](https://yarnpkg.com):

```sh
yarn add @plusauth/oidc-client-js
```

### Documentation
Documentation is served on PlusAuth documentation site. You can reach it from [here](https://docs.plusauth.com/tools/oidc-client-js)

### Api Docs

Please visit [here](https://plusauth.github.io/oidc-client-js/classes/OIDCClient.html)


### Examples

Have a look at [examples directory](/examples) for various examples
