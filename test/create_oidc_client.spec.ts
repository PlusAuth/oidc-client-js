import createOIDCClient, {OIDCClient} from "../src";

describe('createOidcClient', function () {
  it('should create oidc client and initialize it', function (done) {
    const initMock = jest.fn( async () => ({}))
    // @ts-ignore
    OIDCClient.prototype.initialize = initMock
    createOIDCClient({
      issuer: 'https://test.plusauth.com/',
      client_id: 'test',
      endpoints: { authorization_endpoint: 'dummy_auth'}
    }).then(() => {
      expect(initMock).toBeCalled()
      done()
    })
  });
})
