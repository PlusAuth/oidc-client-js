import NodeJsCrypto from "node:crypto"
import { describe, expect, it } from "vitest"
import { sha256 } from "../../src/utils/crypto"

describe("crypto utils", () => {
  it("sha-256", async () => {
    const values = [
      "Pp%Dq#jMV$A3^AEo8^7U*p@5",
      "vcJj#g71VvGN$4^8q&SblIU@",
      "Wy2W7#$$qdlRe6@3*j^50&$F",
      "AgFNo7A@&KPT8E&*4fe7^RY&",
      "2&xPP!d1ZV45qa^MR1%o@p%t",
      "IVN3$qK*nXD4FJEx08csGW",
      "7L23t1#6SZ3XH$6$QFR1&",
      "zF4jG^uE86zrTM2C47hr",
      "PtwPy*H@wz1Wlk4e",
      "KPKn4iJ$fauv",
      "QX;'\"2\\]/{1{3})=-_",
    ]

    async function withoutWindowCrypto(v: string) {
      const originalCrypto = window.crypto

      // Redefine crypto as undefined (or empty object)
      Object.defineProperty(window, "crypto", {
        value: undefined,
        configurable: true,
      })

      try {
        return await sha256(v)
      } finally {
        // Restore original value
        Object.defineProperty(window, "crypto", {
          value: originalCrypto,
          configurable: true,
        })
      }
    }

    for (const value of values) {
      // @ts-expect-error
      const hash = await NodeJsCrypto.createHash("sha256").update(value).digest("base64url")
      expect(
        [await sha256(value), await withoutWindowCrypto(value)].every((v) => v === hash),
      ).toBeTruthy()
    }
  })
})
