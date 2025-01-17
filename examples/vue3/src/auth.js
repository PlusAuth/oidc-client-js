import { OIDCClient } from "../../../src/index"

const auth = new OIDCClient({
  issuer: import.meta.env.VITE_OIDC_ISSUER,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: "http://localhost:3001/callback",
  post_logout_redirect_uri: "http://localhost:3001",
  autoSilentRenew: true,
  checkSession: true,
  audience: "http://exampleapp1-backend.com",
  requestUserInfo: true,
  scope:
    "openid profile secure read:user write:user af:admin:secret admin af:user:test af:workflow:test",
  silent_redirect_uri: "http://localhost:3001/silent-renew.html",
})

auth.on("silent_renew_error", console.error)
auth.on("session_change", console.debug)
auth.on("session_error", console.error)
auth.on("silent_renew_success", console.debug)
export default auth
