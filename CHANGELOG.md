# [0.7.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.6.3...v0.7.0) (2021-05-06)


### Bug Fixes

* errors in token requests are not thrown ([310b41d](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/310b41df84d5667ccf5105520af080964bd08920))


### Features

* throw fetch errors on initialize ([9c8c41a](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/9c8c41a0212000a28979b69c3432f97ecf46dcf4))

## [0.6.3](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.6.2...v0.6.3) (2020-11-15)

## [0.6.2](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.6.1...v0.6.2) (2020-11-15)


### Bug Fixes

* prevent multiple calls of initialize from sending oidc info request ([e2c7bbf](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/e2c7bbfb285f14a47557b5a3e8792c1f4bb0edfc))

## [0.6.1](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.6.0...v0.6.1) (2020-11-15)


### Bug Fixes

* silent login is called twice on initialize ([e9035d0](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/e9035d008e3599a428b263e6830c3dd924b1d89f))

# [0.6.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.5.0...v0.6.0) (2020-11-15)


### Bug Fixes

* silent login executed on session check error ([4771d7d](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/4771d7d1a4980c22d1196fa281a43dc73ad83f13))


### Features

* add initialize check on silent login ([b95d74a](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/b95d74a06ae0498d9f853782731209ac46f0191a))

# [0.5.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.4.0...v0.5.0) (2020-11-15)


### Features

* add corresponding events for silent renew and session checker ([974cb53](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/974cb53ff21e4351ded88f02fbf16d90a5cc4f5e))

# [0.4.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.3.0...v0.4.0) (2020-10-16)

# [0.3.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.2.0...v0.3.0) (2020-10-08)


### Features

* return scope list from getScope ([6647ac9](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/6647ac9c1f98b3c0b9b3db7f3edc6687c196b3a5))

# [0.2.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.1.2-beta.0...v0.2.0) (2020-10-08)


### Bug Fixes

* handle cases where expires_in is string ([8b6c71e](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/8b6c71eb15ac84b65ceee4a7ecd21a93afafb098))


### Features

* add instance variables for direct access ([62b7794](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/62b77942be84a0260929d1c22d32086b886b5ef1))
* check for userinfo endpoint before fetching userinfo ([9479068](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/9479068bb8f382062c1f52e38271ae08ebec51ee))
* in memory state store ([5e40a00](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/5e40a00f7f5b257192f245b398042d8af748f843))
* silent_redirect_uri support ([3dc7a9f](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/3dc7a9f95021ecf0367a97a0b4ecebd970b13ce1))
* use in memory storage for auth store ([9f3f820](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/9f3f8204a4b44582ee5bc01f26c7d0244e5f534e))

## [0.1.2-beta.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.1.1...v0.1.2-beta.0) (2020-10-06)


### Bug Fixes

* audience check fails for id_token ([4e6874f](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/4e6874f1542badd354fa641b51559ec9c8d81ec2))

## [0.1.1](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.1.0...v0.1.1) (2020-10-06)


### Bug Fixes

* auth response params cannot be parsed if response type is fragment ([5d5284d](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/5d5284d1acd9acf4f629c91501917494fa5dd16e))
* auth state get deleted whenever temporary state delete requested ([b165cd3](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/b165cd3c950a068de0aede92c8b5ca95f513be88))
* code challenge is generated always ([c7d6bdb](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/c7d6bdb38da1e808d8602b0a0a8a546459e1a2f8))
* isLoggedIn returns wrong result ([4e2343c](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/4e2343ca0d2559cf34c1abef55761db334157f46))
* logout event is not fired on session end ([bdd75bf](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/bdd75bf66ce3ad7ab6cd4441d2050419fc414ffa))
* nonce is not generated when openid scope exists ([6a01e86](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/6a01e86c4159ee3a951e99ddee63d1eb0cc962a6))
* popup result is not passed to opener window ([3c63b3a](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/3c63b3a35ae9928f09e0c940709d26f5e1163771))

# 0.1.0 (2020-08-27)


### Bug Fixes

* cannot exchange authorization code in silent login ([fe36a0f](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/fe36a0f220c571d1970e0a9b95b8bcf1408f122d))
* sso logout does not clear local auth store ([80faf4a](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/80faf4a1bc62ce5ce41c7f14e2cf358f35cb9bfe))


### Features

* add initialized flag ([3115a0e](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/3115a0e4ddfa821205a2e8905797c33edc6bb9ca))
* add sub claim to user profile ([4dfb78e](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/4dfb78e8719cf76105583cbc5981a913b8fd945d))
* use merged options in constructor ([e1a8799](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/e1a879934a7961f2bc968cba107ce4104b4bebf0))

