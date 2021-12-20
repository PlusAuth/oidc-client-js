import { OIDCClient } from '../../../src/index';

new OIDCClient({
  issuer: import.meta.env.VITE_OIDC_ISSUER,
}).loginCallback();
