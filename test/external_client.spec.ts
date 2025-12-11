import "whatwg-fetch"
import { expect, it } from "vitest"
import { OIDCClient } from "../src"

it("initializes OIDC and loads issuer metadata", async () => {
  const oidc = new OIDCClient({ issuer: "https://accounts.google.com", client_id: "test" })

  await oidc.initialize(false)

  expect(oidc.issuer_metadata).toHaveProperty("authorization_endpoint")
})
