import { OIDCClient } from "../../../src/index";

const auth= new OIDCClient({
  issuer: import.meta.env.VITE_OIDC_ISSUER,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: 'http://localhost:3001/callback',
  post_logout_redirect_uri: 'http://localhost:3001',
  autoSilentRenew: true,
  checkSession: true,
  requestUserInfo: true,
  scope: 'openid profile secure',
  silent_redirect_uri: 'http://localhost:3001/silent-renew.html'
})

export default auth
