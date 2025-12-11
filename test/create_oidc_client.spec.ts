import { describe, expect, it, vi } from "vitest"
import createOIDCClient, { OIDCClient } from "../src"

describe("createOidcClient", () => {
  it("should create oidc client and initialize it", () => {
    const initMock = vi.fn(async () => ({}))
    // @ts-expect-error
    OIDCClient.prototype.initialize = initMock
    createOIDCClient({
      issuer: "https://test.plusauth.com/",
      client_id: "test",
      endpoints: { authorization_endpoint: "dummy_auth" },
    }).then(() => {
      expect(initMock).toHaveBeenCalled()
    })
  })
})
