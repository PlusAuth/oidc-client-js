import "whatwg-fetch"
import {OIDCClient} from "../src";

it('should fetch issuer metadata when endpoints not provided ', function (done) {
  const oidc = new OIDCClient({ issuer: 'https://accounts.google.com', client_id: 'test'})

  oidc.initialize(false).then(()=>{
    expect(oidc.issuer_metadata).toHaveProperty('authorization_endpoint')
    done()
  }).catch(done.fail)
});
