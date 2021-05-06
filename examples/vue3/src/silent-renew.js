import { OIDCClient } from '../../..';

new OIDCClient({
  issuer: import.meta.env.VITE_OIDC_ISSUER,
}).loginCallback();
