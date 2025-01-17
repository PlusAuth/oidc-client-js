import { InvalidIdTokenError, InvalidJWTError, OIDCClientError } from "../../src"
import {
  deriveChallenge,
  generateRandom,
  parseJwt,
  validateIdToken,
  validateJwt,
} from "../../src/utils"

import * as fs from "node:fs"
import { type Algorithm, sign } from "jsonwebtoken"

const expectedIssuer = "https://localhost:44333/core"
const expectedAudience = "js.tokenmanager"
const notBefore = 1459129901
const issuedAt = notBefore
const expiresIn = 1459130201
const clientId = "cid"
const expectedNonce = "S1MIYRbKC33BDbyz"
const rsaKey = JSON.parse(fs.readFileSync(`${__dirname}/rsa.pub.json`).toString("utf-8"))
const expectedNow = (remove = 0) => (notBefore - remove) * 1000

type createJWTOptions = {
  issuer?: string
  audience?: string | string[]
  nbf?: number
  exp?: number
  iat?: number
  payload?: Record<string, any>
}

const defaultJWTOps = {
  issuer: expectedIssuer,
  audience: expectedAudience,
  nbf: notBefore,
  exp: expiresIn,
  iat: issuedAt,
  payload: {},
}

const jwtFromRsa: string = createJWT({ payload: { nonce: expectedNonce } })

const idToken: string = createJWT({ payload: { nonce: expectedNonce, sub: "test" } })

function createJWT(
  opts: createJWTOptions = {},
  algOpts: { key: Buffer | string; alg?: Algorithm; kid?: string } = {
    key: fs.readFileSync(`${__dirname}/rsa.pem`),
    alg: "RS256",
    kid: "wNksAM3jUffQgCSGMMEGGVeYHmdrKNsaEaWSQANKgSQ",
  },
) {
  opts = Object.assign({}, defaultJWTOps, opts)
  return sign(
    {
      nbf: opts.nbf,
      ...(opts.exp && { exp: opts.exp }),
      ...(opts.iat && { iat: opts.iat }),
      ...(opts.payload && opts.payload),
    },
    algOpts.key,
    {
      noTimestamp: !opts.iat,
      mutatePayload: true,
      ...(algOpts.kid && { keyid: algOpts.kid }),
      ...(algOpts.alg && { algorithm: algOpts.alg }),
      ...(opts.audience && { audience: opts.audience }),
      ...(opts.issuer && { issuer: opts.issuer }),
    },
  )
}

describe("jose utils", () => {
  it("should generate random string", () => {
    const randoms = [...Array(100)].map((v) => generateRandom(12))
    expect(randoms.some((value, index) => randoms.indexOf(value) !== index)).toBeFalsy()
  })

  it("should fail if code length is not in accepted range", (done) => {
    deriveChallenge(new Array(11).join("a"))
      .then(done.bind(null, "should fail"))
      .catch((e) => {
        expect(e.message).toBe(`Invalid code length: 10`)
        done()
      })
  })

  it("should consume generated random string", (done) => {
    deriveChallenge(new Array(12).join("test"))
      .then((value) => {
        expect(value).toBe("MM2_1QPyiAvVfPjvMOuJUXU7CbDFDeUZtDK74EbtMGw")
        done()
      })
      .catch(done)
  })
  describe("parseJwt", () => {
    it("should parse a jwt", () => {
      const result = parseJwt(jwtFromRsa)
      expect(result).toHaveProperty("header")
      expect(result).toHaveProperty("payload")
      expect(result.header).toMatchObject({
        typ: "JWT",
        alg: "RS256",
        kid: "wNksAM3jUffQgCSGMMEGGVeYHmdrKNsaEaWSQANKgSQ",
      })

      expect(result.payload).toMatchObject({
        iss: expectedIssuer,
        aud: expectedAudience,
        exp: expiresIn,
        nbf: notBefore,
        nonce: expectedNonce,
        iat: issuedAt,
      })
    })

    it("should return undefined for an invalid jwt", async () => {
      expect(() => {
        parseJwt("junk")
      }).toThrow(InvalidJWTError)
    })
  })

  describe("validateJwt", () => {
    it("should fail for missing iss", () => {
      try {
        validateJwt(createJWT({ issuer: undefined }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe("Issuer (iss) was not provided")
      }
    })

    it("should not validate for invalid issuer", () => {
      try {
        validateJwt(jwtFromRsa, {
          issuer: "invalid iss",
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Invalid Issuer (iss) in token: ${expectedIssuer}`)
      }
    })

    it("should fail for missing aud", () => {
      try {
        validateJwt(createJWT({ audience: undefined }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe("Audience (aud) was not provided")
      }
    })

    it("should allow array aud", () => {
      expect(
        validateJwt(createJWT({ audience: [expectedAudience] }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: "",
        }),
      ).toBeDefined()
    })

    it("should allow client_id to be aud if aud not provided", () => {
      expect(
        validateJwt(createJWT({ audience: clientId }), {
          issuer: expectedIssuer,
          audience: undefined,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: clientId,
        }),
      ).toBeDefined()
    })

    it("should not validate for invalid audience", () => {
      try {
        validateJwt(jwtFromRsa, {
          issuer: expectedIssuer,
          audience: "invalid aud",
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Invalid Audience (aud) in token: ${expectedAudience}`)
      }
    })

    it("should fail for wrong azp", () => {
      try {
        validateJwt(createJWT({ payload: { azp: "wrong_azp" } }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Invalid Authorized Party (azp) in token: wrong_azp`)
      }
    })

    it("should not validate before nbf", () => {
      try {
        validateJwt(createJWT({ nbf: notBefore + 10 }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Not Before time (nbf) is in the future: ${notBefore + 10}`)
      }
    })

    it("should allow nbf within clock skew", () => {
      const p1 = validateJwt(jwtFromRsa, {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: expectedNow.bind(null, 1),
        client_id: "",
      })
      const p2 = validateJwt(jwtFromRsa, {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: expectedNow.bind(null, 10),
        client_id: "",
      })
      expect(p1).toBeDefined()
      expect(p2).toBeDefined()
    })

    it("should not allow nbf outside clock skew", () => {
      try {
        validateJwt(jwtFromRsa, {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 10,
          currentTimeInMillis: expectedNow.bind(null, 11),
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Issued At (iat) is in the future: ${issuedAt}`)
      }
    })

    it("should fail for missing iat", () => {
      try {
        validateJwt(createJWT({ iat: undefined }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe("Issued At (iat) was not provided")
      }
    })

    it("should not validate before iat", () => {
      try {
        validateJwt(jwtFromRsa, {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 10,
          currentTimeInMillis: () => issuedAt - 1,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Issued At (iat) is in the future: ${issuedAt}`)
      }
    })

    it("should allow iat within clock skew", () => {
      const p1 = validateJwt(jwtFromRsa, {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: () => (issuedAt - 1) * 1000,
        client_id: "",
      })
      const p2 = validateJwt(jwtFromRsa, {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: () => (issuedAt - 10) * 1000,
        client_id: "",
      })
      expect(p1).toBeDefined()
      expect(p2).toBeDefined()
    })

    it("should not allow iat outside clock skew", () => {
      try {
        validateJwt(jwtFromRsa, {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 10,
          currentTimeInMillis: () => (issuedAt - 11) * 1000,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Issued At (iat) is in the future: ${issuedAt}`)
      }
    })

    it("should fail for missing exp", () => {
      try {
        validateJwt(createJWT({ exp: undefined }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe("Expiration Time (exp) was not provided")
      }
    })

    it("should not validate after exp", () => {
      try {
        validateJwt(jwtFromRsa, {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: () => (expiresIn + 1) * 1000,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Expiration Time (exp) is in the past: ${expiresIn}`)
      }
    })

    it("should allow exp within clock skew", () => {
      const p1 = validateJwt(jwtFromRsa, {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: () => (expiresIn + 1) * 1000,
        client_id: "",
      })
      const p2 = validateJwt(jwtFromRsa, {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: () => (expiresIn + 10) * 1000,
        client_id: "",
      })
      expect(p1).toBeDefined()
      expect(p2).toBeDefined()
    })

    it("should not allow exp outside clock skew", () => {
      try {
        validateJwt(jwtFromRsa, {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 10,
          currentTimeInMillis: () => (expiresIn + 11) * 1000,
          client_id: "",
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Expiration Time (exp) is in the past: ${expiresIn}`)
      }
    })
  })

  describe("validateIdToken", () => {
    it("should fail if nonce is not provided", () => {
      try {
        // @ts-expect-error
        validateIdToken("token", null, {})
      } catch (e) {
        expect(e).toBeInstanceOf(OIDCClientError)
        expect(e.message).toBe("No nonce on state")
      }
    })

    it("should fail with missing parts of id_token", () => {
      const jwtWithoutPayload =
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InIxTGtiQm8zOTI1UmIyWkZGckt5VTNNVmV4OVQyODE3S3gwdmJpNmlfS2MifQ..Yg_fGFInWZLGRA-Bjz9rThskwLhVScUhYnolZF6eOScubh0hZ02ewE8iC0-cnT6ZBFe4M7DWPimXifrS2uo__N5JJzVUOyE0nwVlDYJh2cqtAUGZ2lCaz4AXftdZ4FkQeugeGa9wiYnyZhFJKYDpqEPl4Ignv6ZbwSioLNKAFp8Q5P2WZOd1CTxhKjQ-Ctc3qHtD1nzsKwlR4sBKT6GXVC_SHa_tUnBJ4b-r4Xyf0TTzghKeE2eJnKCi3nduBV7ZybRCPBYQ2rZWI8GcZgpGCDOpnMP77XPHsc5bncB9Dh7lhwRje8hFtJ0SWHTOaSLF34NN1sa-S6PkXdCSnFDWog"
      try {
        //@ts-expect-error
        validateIdToken(jwtWithoutPayload, "nonce", {})
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidIdTokenError)
        expect(e.message).toBe("Failed to parse jwt")
      }
    })

    it("should fail with wrong id_token", () => {
      try {
        //@ts-expect-error
        validateIdToken("somestring", "nonce", {})
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidIdTokenError)
        expect(e.message).toBe("Failed to parse jwt")
      }
    })

    it("should fail with invalid nonce", () => {
      try {
        //@ts-expect-error
        validateIdToken(idToken, "wrongNone", {})
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidIdTokenError)
        expect(e.message).toBe(`Invalid nonce in id_token: ${expectedNonce}`)
      }
    })

    it("should fail with missing sub", () => {
      try {
        validateIdToken(createJWT({ payload: { nonce: expectedNonce } }), expectedNonce, {
          issuer: expectedIssuer,
          audience: expectedAudience,
          currentTimeInMillis: expectedNow,
          client_id: expectedAudience,
          clockSkew: 0,
        })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidIdTokenError)
        expect(e.message).toBe(`No Subject (sub) present in id_token`)
      }
    })

    it("should pass with correct id_token", () => {
      expect(
        validateIdToken(idToken, expectedNonce, {
          issuer: expectedIssuer,
          client_id: expectedAudience,
          audience: expectedAudience,
          currentTimeInMillis: expectedNow,
          clockSkew: 0,
        }),
      ).toBeDefined()
    })
  })
})
