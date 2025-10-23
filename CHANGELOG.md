# Changelog

## [1.7.1](https://github.com/PlusAuth/oidc-client-js/compare/v1.7.0...v1.7.1) (2025-10-23)


### Bug Fixes

* iframe timeout is not applied to load timer ([d6a7df6](https://github.com/PlusAuth/oidc-client-js/commit/d6a7df65085c3f15d5ff978ce10a98ebad509c26))

# [1.7.0](https://github.com/PlusAuth/oidc-client-js/compare/v1.6.0...v1.7.0) (2025-04-10)


### Features

* allow user provided state and nonce values ([362df49](https://github.com/PlusAuth/oidc-client-js/commit/362df495914e39c8b3a1c0ecad16561ce659752d)), closes [#21](https://github.com/PlusAuth/oidc-client-js/issues/21)

# [1.6.0](https://github.com/PlusAuth/oidc-client-js/compare/v1.5.0...v1.6.0) (2025-04-03)


### Bug Fixes

* scopes method returns requested scopes if the AS returns empty scope ([8a2deb1](https://github.com/PlusAuth/oidc-client-js/commit/8a2deb1c4fa6a1eaf8e57653d29f3229ad44ad4a))


### Features

* filter empty strings from scopes ([807d28d](https://github.com/PlusAuth/oidc-client-js/commit/807d28dd7eadb55be01571b51cbe0c0324d6995d))

# [1.5.0](https://github.com/PlusAuth/oidc-client-js/compare/v1.4.2...v1.5.0) (2025-01-17)


### Features

* allow the library to be used in non-secure contexts ([b384d5b](https://github.com/PlusAuth/oidc-client-js/commit/b384d5b202b4c5cd3b3ac24dcf5d70fd08f4ee74))

## [1.4.2](https://github.com/PlusAuth/oidc-client-js/compare/v1.4.1...v1.4.2) (2024-08-21)


### Bug Fixes

* user state is not set on initialize when checkLogin = false ([3bcb9a6](https://github.com/PlusAuth/oidc-client-js/commit/3bcb9a67a8ad06dd6fd11ada2abb6961178b4879))

## [1.4.1](https://github.com/PlusAuth/oidc-client-js/compare/v1.4.0...v1.4.1) (2023-10-17)


### Bug Fixes

* access token renewal wont start on inital load ([c5f09f4](https://github.com/PlusAuth/oidc-client-js/commit/c5f09f456fd1903885a536f476a4fce9eead237d))
* synchronizer events not fired when localStorage is disabled ([0cfae29](https://github.com/PlusAuth/oidc-client-js/commit/0cfae292c69b06e17a7cb574aef947000617594c))

# [1.4.0](https://github.com/PlusAuth/oidc-client-js/compare/v1.3.0...v1.4.0) (2023-09-08)


### Features

* options for providing custom state and nonce length ([24970cc](https://github.com/PlusAuth/oidc-client-js/commit/24970cc969e13851c0a515afe176f4e70bb2eeb0))

# [1.3.0](https://github.com/PlusAuth/oidc-client-js/compare/v1.2.5...v1.3.0) (2023-09-06)


### Bug Fixes

* incorrect getter for expires_in ([d427e22](https://github.com/PlusAuth/oidc-client-js/commit/d427e228e8867569e4ab4152be0cc5a1c316d314)), closes [#17](https://github.com/PlusAuth/oidc-client-js/issues/17)


### Features

* specific error when local state does not exist ([b931a54](https://github.com/PlusAuth/oidc-client-js/commit/b931a54d82c413a8511b279998a82943bf7cd5e5))

## [1.2.5](https://github.com/PlusAuth/oidc-client-js/compare/v1.2.4...v1.2.5) (2023-05-12)


### Bug Fixes

* object merging behaves incorrectly for classes ([6a6c09d](https://github.com/PlusAuth/oidc-client-js/commit/6a6c09db5741c0c780a1161f7b6096001a3be946)), closes [#14](https://github.com/PlusAuth/oidc-client-js/issues/14)

## [1.2.4](https://github.com/PlusAuth/oidc-client-js/compare/v1.2.3...v1.2.4) (2023-05-06)


### Bug Fixes

* silent login options are not using client defaults. regression in v1.2.3 ([d00e0f2](https://github.com/PlusAuth/oidc-client-js/commit/d00e0f2f193ec155be15656a061de6666eb986d4))

## [1.2.3](https://github.com/PlusAuth/oidc-client-js/compare/v1.2.2...v1.2.3) (2023-05-04)


### Bug Fixes

* merge options properly, ignore undefined ([cfd0cd8](https://github.com/PlusAuth/oidc-client-js/commit/cfd0cd8d4c4e267f6c714109461ed0ff2f4bc0fc)), closes [#13](https://github.com/PlusAuth/oidc-client-js/issues/13)

## [1.2.2](https://github.com/PlusAuth/oidc-client-js/compare/v1.2.1...v1.2.2) (2023-04-09)

## [1.2.1](https://github.com/PlusAuth/oidc-client-js/compare/v1.2.0...v1.2.1) (2023-03-27)


### Bug Fixes

* silent renew error not emitted on initialization ([1ddc260](https://github.com/PlusAuth/oidc-client-js/commit/1ddc26095f0c036552fb6f99d4ee25059ccabb9a))

# [1.2.0](https://github.com/PlusAuth/oidc-client-js/compare/v1.1.2...v1.2.0) (2023-03-14)


### Bug Fixes

* cannot override response mode and prompt for silent login ([15c404e](https://github.com/PlusAuth/oidc-client-js/commit/15c404e077bef9392af77fc9b21346db04647a4f)), closes [#9](https://github.com/PlusAuth/oidc-client-js/issues/9)
* cannot override response mode for popup login ([89359d2](https://github.com/PlusAuth/oidc-client-js/commit/89359d20172484ebaddd67747738e17315084251)), closes [#10](https://github.com/PlusAuth/oidc-client-js/issues/10)
* cannot resolve state if web message does not contain it ([a9f899f](https://github.com/PlusAuth/oidc-client-js/commit/a9f899f4ba5b8a4af9a78ae3e8410d5725a91c17))


### Features

* add getter for expires_at ([9c8718e](https://github.com/PlusAuth/oidc-client-js/commit/9c8718e36c50f56ca743ede999ef67fbae1bc4d3)), closes [#7](https://github.com/PlusAuth/oidc-client-js/issues/7)

## [1.1.2](https://github.com/PlusAuth/oidc-client-js/compare/v1.1.1...v1.1.2) (2023-02-24)


### Bug Fixes

* response_mode param not included in auth request ([d3767dc](https://github.com/PlusAuth/oidc-client-js/commit/d3767dcb86f274ea2005c6e05ab11011ca19e93a)), closes [#6](https://github.com/PlusAuth/oidc-client-js/issues/6)

## [1.1.1](https://github.com/PlusAuth/oidc-client-js/compare/v1.1.0...v1.1.1) (2023-02-23)


### Bug Fixes

* get requests include headers resulting to fail with cors ([2b5519a](https://github.com/PlusAuth/oidc-client-js/commit/2b5519aebe94e1dedbfeb34eb742984eece558bd)), closes [#4](https://github.com/PlusAuth/oidc-client-js/issues/4)

# [1.1.0](https://github.com/PlusAuth/oidc-client-js/compare/v1.0.0...v1.1.0) (2023-02-07)


### Features

* throw custom error when user closes popup ([41ceb5d](https://github.com/PlusAuth/oidc-client-js/commit/41ceb5dbbdf39eacc84d0d2b2a6a1187ad9cc081))

# [1.0.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.12.0...v1.0.0) (2022-10-27)


### Bug Fixes

* retrying initialize attempts returns first failed response ([918794e](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/918794e053b06d9bcd214ced05423f6b57a16b0c))


### Features

* `silentRequestTimeout` option ([6001cdd](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/6001cddc3146b6fb4a28cdc7140be0610258d734))
* accessor for raw idtoken ([a999894](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/a999894def817ba1993dcc01eb14953a6d374018))
* allow objects in extra params ([6b83144](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/6b83144060113ed4ded41db66f9b37b35af140fc))
* assume silent renew failed when no redirect happens ([1aa6540](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/1aa65407b3593e319e3afe751ed3e6a73459eac3))
* claims parameter support ([ee35343](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/ee35343d2bc565ec59f337ca1587d4469a1ecb70))
* clear auth store when initialization fails ([9e5c9b9](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/9e5c9b9ad08cce2e083c223667b3287290fe3baa))
* do not fail initializing client when login checking fails ([91c576e](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/91c576ec4eb1933897845744a90dae08886e2acb))

# [0.12.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.11.0...v0.12.0) (2021-12-23)


### Bug Fixes

* accessibility warning for hidden iframe ([417cb2f](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/417cb2f033876076e79ec9d93da3a39b0a020a05))


### Features

* try fetching oidc metadata from well-known endpoint in case of missing endpoints ([0caec70](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/0caec70d733b127c27ef73c969f518a1a9e2d51b))

# [0.11.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.10.2...v0.11.0) (2021-12-20)


### Bug Fixes

* initialization promise is not waited correctly ([4712244](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/47122444b4c6c1b3b02df2412d35f73ba2647710))
* login synchronizing across tabs is not per issuer ([906206e](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/906206ece683a8ea54e5cdd7ab1b4bc4d428dbc4))
* on login listener fails without localstorage ([daa9a1e](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/daa9a1e0f2896e832d75631928b591415428f958))
* session is not checked on init ([c504798](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/c504798fd577b598a00c1db8633bc085f0889b3d))


### Features

* allow changing session checking interval ([a626bb6](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/a626bb6343741983dc873c19378f561ce55993a8))
* check login only on initialization ([4834080](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/4834080c5caaebd123581d58f76f588339f73bac))
* cross tab login synchronization ([d7710e1](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/d7710e1ff45de038f935e874e403cee43968b3e7))
* throw error when auth endpoint is missing ([b9fbb2f](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/b9fbb2ff510f8fc9e37e3f3b5a29148ff9436278))
* use tab utils instead of broadcast-channel ([1397dca](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/1397dcaeaf0d014c9227f4000ca521cc2138aa9c))

## [0.10.2](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.10.1...v0.10.2) (2021-07-02)


### Bug Fixes

* incorrect issuer uri validation ([aae260a](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/aae260ad86b8c9182a85fe431537d76c066cb87b)), closes [#2](https://github.com/PlusAuth/plusauth-oidc-client-js/issues/2)


### Features

* include search and hash params check in issuer validation ([30dca0d](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/30dca0dcfb60133ff62cefd18a79cb0abef66372))

## [0.10.1](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.10.0...v0.10.1) (2021-06-28)


### Bug Fixes

* logout does not use id token raw ([edd97e7](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/edd97e712d9ebc27964aadb93efbd4c473c9541f))

# [0.10.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.9.0...v0.10.0) (2021-06-17)


### Bug Fixes

* latest auth params are not passed to silent login with refresh_token ([13edacf](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/13edacfe71b832626dcfa9d46965b437db4aa04c))
* token issued time validations fails with decimal time ([710e6db](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/710e6dbb08d62a98be8b4f71d23b1229146823aa))


### Features

* separate methods for parsed and raw id token retrieval ([6e6ca13](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/6e6ca137a87b6b51f7bdd9689e6ba17922a00a5b))

# [0.9.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.8.0...v0.9.0) (2021-05-26)


### Bug Fixes

* popup mode not resolving error ([fa9c213](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/fa9c213a11ff7a02dcf928e32baa2c569a844157))


### Features

* conform rfc4648 (jwt b64 url) ([3d42976](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/3d429765d5dfef887d7bcb10834f4fef54c7283e))

# [0.8.0](https://github.com/PlusAuth/plusauth-oidc-client-js/compare/v0.7.0...v0.8.0) (2021-05-19)


### Features

* emit user logout on session change ([0c9ba2c](https://github.com/PlusAuth/plusauth-oidc-client-js/commit/0c9ba2cc95e8a9b9ef6628c1681ba127ee578f54))

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
