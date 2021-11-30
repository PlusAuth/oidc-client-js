import { OIDCClient } from "../../../src/index";

const auth= new OIDCClient({
  issuer: import.meta.env.VITE_OIDC_ISSUER,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: 'http://localhost:3001/callback',
  response_mode: 'form_post',
  response_type: 'id_token token',
  post_logout_redirect_uri: 'http://localhost:3001',
  autoSilentRenew: true,
  checkSession: true,
  audience: 'https://test.com',
  requestUserInfo: true,
  scope: 'openid profile secure read:user write:user af:admin:secret admin af:user:test af:workflow:test',
  silent_redirect_uri: 'http://localhost:3001/silent-renew.html'
})

export default auth
