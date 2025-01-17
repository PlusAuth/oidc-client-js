import { OIDCClient } from "../../../"

const auth = new OIDCClient({
  issuer: process.env.VUE_APP_OIDC_ISSUER,
  client_id: process.env.VUE_APP_OIDC_CLIENT_ID,
  redirect_uri: "http://localhost:8080/callback",
  post_logout_redirect_uri: "http://localhost:8080",
  autoSilentRenew: true,
  checkSession: true,
  requestUserInfo: true,
  scope: "openid profile secure",
  silent_redirect_uri: "http://localhost:8080/silent-renew.html",
})

export default auth
