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

