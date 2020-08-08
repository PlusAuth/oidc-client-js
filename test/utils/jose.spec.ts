import {deriveChallenge, generateRandom, parseJwt, validateIdToken, validateJwt} from "../../src/utils";
import {InvalidIdTokenError, InvalidJWTError, PAError} from "../../src";

import {Algorithm, sign} from 'jsonwebtoken'
import * as fs from "fs";

const expectedIssuer = "https://localhost:44333/core";
const expectedAudience = "js.tokenmanager";
const notBefore = 1459129901;
const issuedAt = notBefore;
const expiresIn = 1459130201;
const clientId = 'cid';
const expectedNonce = "S1MIYRbKC33BDbyz"
const rsaKey = JSON.parse(fs.readFileSync(__dirname + '/rsa.pub.json').toString('utf-8'))
const expectedNow = (remove: number = 0) => (notBefore - remove)* 1000;

type createJWTOptions = {
  issuer?: string;
  audience?: string | string[];
  nbf?: number;
  exp?: number;
  iat?: number;
  payload?: Record<string, any>;
}

const defaultJWTOps = {
  issuer: expectedIssuer,
  audience: expectedAudience,
  nbf: notBefore,
  exp: expiresIn,
  iat: issuedAt,
  payload: {}
}

let jwtFromRsa: string = createJWT({ payload: {nonce: expectedNonce} } )

let idToken: string = createJWT({ payload: {nonce: expectedNonce, sub: 'test'}})

function createJWT(opts: createJWTOptions = {}, algOpts: { key: Buffer | string, alg?: Algorithm, kid?: string} = {
  key: fs.readFileSync(__dirname + '/rsa.pem'),
  alg: 'RS256',
  kid: 'wNksAM3jUffQgCSGMMEGGVeYHmdrKNsaEaWSQANKgSQ'
}){
  opts = Object.assign( {},defaultJWTOps, opts)
  return sign({
    nbf: opts.nbf,
    ...opts.exp && {exp: opts.exp},
    ...opts.iat && {iat: opts.iat},
    ...opts.payload && opts.payload
  }, algOpts.key, {
    noTimestamp: !opts.iat,
    mutatePayload: true,
    ...algOpts.kid && { keyid: algOpts.kid},
    ...algOpts.alg && { algorithm: algOpts.alg},
    ...opts.audience && { audience: opts.audience},
    ...opts.issuer && { issuer: opts.issuer},

  } );
}


describe('jose utils', function () {

  it('should generate random string', function () {
    const randoms = [...Array(100)].map(v => generateRandom(12))
    expect( randoms.some((value, index) => randoms.indexOf(value) !== index)).toBeFalsy()
  });

  it('should fail if code length is not in accepted range', function (done) {
    deriveChallenge(new Array(11).join('a'))
      .then(done.fail)
      .catch( (e) => {
        expect(e.message).toBe(`Invalid code length: 10`)
        done()

      })
  });

  it('should consume generated random string', function (done) {

    deriveChallenge(new Array(12).join('test'))
      .then(value => {
        expect(value).toBe("MM2_1QPyiAvVfPjvMOuJUXU7CbDFDeUZtDK74EbtMGw")
        done()
      }).catch(done.fail)
  });
  describe("parseJwt", function () {

    it("should parse a jwt", function () {

      const result = parseJwt(jwtFromRsa);
      expect(result).toHaveProperty('header');
      expect(result).toHaveProperty('payload');
      expect(result.header).toMatchObject({
        "typ": "JWT",
        "alg": "RS256",
        "kid": "wNksAM3jUffQgCSGMMEGGVeYHmdrKNsaEaWSQANKgSQ"
      });

      expect(result.payload).toMatchObject({
        "iss": expectedIssuer,
        "aud": expectedAudience,
        "exp": expiresIn,
        "nbf": notBefore,
        "nonce": expectedNonce,
        "iat": issuedAt,
      });

    });

    it("should return undefined for an invalid jwt", async function () {

      expect(() => {
        parseJwt("junk")
      }).toThrow(InvalidJWTError);
    });

  });


  describe("validateJwt", function () {


    it('should fail for missing iss', function () {
      try{
        validateJwt(createJWT({ issuer: undefined }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          client_id: ''
        })
      } catch(e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe('Issuer (iss) was not provided')
      }
    });

    it("should not validate for invalid issuer", function () {
      try {
        validateJwt(jwtFromRsa,  {
          issuer: "invalid iss",
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Invalid Issuer (iss) in token: ${expectedIssuer}`);
      }
    });

    it('should fail for missing aud', function () {
      try{
        validateJwt(createJWT({ audience: undefined }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe('Audience (aud) was not provided')
      }

    });

    it('should allow array aud', function () {
      expect(validateJwt(createJWT({ audience: [ expectedAudience ] }), {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 0,
        currentTimeInMillis: expectedNow,
        client_id: ''
      })).toBeDefined()
    });

    it('should allow client_id to be aud if aud not provided', function () {
      expect(validateJwt(createJWT({ audience: clientId }), {
        issuer: expectedIssuer,
        audience: undefined,
        clockSkew: 0,
        currentTimeInMillis: expectedNow,
        client_id: clientId
      })).toBeDefined()
    });


    it("should not validate for invalid audience", function () {
      try{

        validateJwt(jwtFromRsa,{
          issuer: expectedIssuer,
          audience: "invalid aud",
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: ''
        })
      } catch(e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Invalid Audience (aud) in token: ${expectedAudience}`);
      }
    });

    it('should fail for wrong azp', function () {

      try {
        validateJwt(createJWT({ payload: { azp: 'wrong_azp'}}),{
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Invalid Authorized Party (azp) in token: wrong_azp`);
      }
    });


    it("should not validate before nbf", function () {
      try {
        validateJwt(createJWT({ nbf: notBefore + 10 } ),  {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Not Before time (nbf) is in the future: ${ notBefore + 10 }`)
      }

    });

    it("should allow nbf within clock skew", function () {

      const p1 = validateJwt(jwtFromRsa, {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: expectedNow.bind(null, 1),
        client_id: ''
      });
      const p2 = validateJwt(jwtFromRsa,  {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: expectedNow.bind(null, 10),
        client_id: ''
      });
      expect(p1).toBeDefined()
      expect(p2).toBeDefined()
    });

    it("should not allow nbf outside clock skew", function () {

      try {
        validateJwt(jwtFromRsa, {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 10,
          currentTimeInMillis: expectedNow.bind(null, 11),
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Issued At (iat) is in the future: ${issuedAt}`);
      }

    });

    it('should fail for missing iat', function () {
      try {
        validateJwt(createJWT({ iat: undefined }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe('Issued At (iat) was not provided')
      }
    });

    it("should not validate before iat", function () {
      try {

        validateJwt(jwtFromRsa,  {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 10,
          currentTimeInMillis: () => issuedAt - 1,
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Issued At (iat) is in the future: ${issuedAt}`);
      }
    });

    it("should allow iat within clock skew", function () {

      const p1 = validateJwt(jwtFromRsa, {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: () => (issuedAt - 1) * 1000,
        client_id: ''
      });
      const p2 = validateJwt(jwtFromRsa, {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: () => (issuedAt - 10) * 1000,
        client_id: ''
      });
      expect(p1).toBeDefined()
      expect(p2).toBeDefined()
    });

    it("should not allow iat outside clock skew", function () {

      try {
        validateJwt(jwtFromRsa, {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 10,
          currentTimeInMillis: () => (issuedAt - 11) * 1000,
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Issued At (iat) is in the future: ${issuedAt}`);
      }
    });

    it('should fail for missing exp', function () {
      try {
        validateJwt(createJWT({ exp: undefined }), {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: expectedNow,
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe('Expiration Time (exp) was not provided')
      }
    });

    it("should not validate after exp", function () {

      try {
        validateJwt(jwtFromRsa,  {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 0,
          currentTimeInMillis: () => (expiresIn + 1)* 1000,
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Expiration Time (exp) is in the past: ${expiresIn}`);
      }

    });

    it("should allow exp within clock skew", function () {

      const p1 = validateJwt(jwtFromRsa, {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: () => (expiresIn + 1)*1000,
        client_id: ''
      });
      const p2 = validateJwt(jwtFromRsa,  {
        issuer: expectedIssuer,
        audience: expectedAudience,
        clockSkew: 10,
        currentTimeInMillis: () => (expiresIn + 10)*1000,
        client_id: ''
      });
      expect(p1).toBeDefined()
      expect(p2).toBeDefined()
    });

    it("should not allow exp outside clock skew", function () {

      try {

        validateJwt(jwtFromRsa, {
          issuer: expectedIssuer,
          audience: expectedAudience,
          clockSkew: 10,
          currentTimeInMillis: () => (expiresIn + 11) * 1000,
          client_id: ''
        })
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidJWTError)
        expect(e.message).toBe(`Expiration Time (exp) is in the past: ${expiresIn}`);
      }


    });

  });

  describe("validateIdToken", function () {

    it('should fail if nonce is not provided', function () {
      try{
        // @ts-expect-error
        validateIdToken('token', null, {} )
      }catch (e) {
        expect(e).toBeInstanceOf(PAError)
        expect(e.message).toBe('No nonce on state')
      }
    });

    it('should fail with missing parts of id_token', function () {
      const jwtWithoutPayload = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InIxTGtiQm8zOTI1UmIyWkZGckt5VTNNVmV4OVQyODE3S3gwdmJpNmlfS2MifQ..Yg_fGFInWZLGRA-Bjz9rThskwLhVScUhYnolZF6eOScubh0hZ02ewE8iC0-cnT6ZBFe4M7DWPimXifrS2uo__N5JJzVUOyE0nwVlDYJh2cqtAUGZ2lCaz4AXftdZ4FkQeugeGa9wiYnyZhFJKYDpqEPl4Ignv6ZbwSioLNKAFp8Q5P2WZOd1CTxhKjQ-Ctc3qHtD1nzsKwlR4sBKT6GXVC_SHa_tUnBJ4b-r4Xyf0TTzghKeE2eJnKCi3nduBV7ZybRCPBYQ2rZWI8GcZgpGCDOpnMP77XPHsc5bncB9Dh7lhwRje8hFtJ0SWHTOaSLF34NN1sa-S6PkXdCSnFDWog'
      try {
        //@ts-expect-error
        validateIdToken(jwtWithoutPayload, 'nonce', { issuer_metadata: { keys: {}}} )

      }catch (e) {
        expect(e).toBeInstanceOf(InvalidIdTokenError)
        expect(e.message).toBe('Failed to parse jwt')
      }
    });

    it('should fail with wrong id_token', function () {
      try {
        //@ts-expect-error
        validateIdToken('somestring', 'nonce', { issuer_metadata: { keys: {}}} )
      }catch (e) {
        expect(e).toBeInstanceOf(InvalidIdTokenError)
        expect(e.message).toBe('Failed to parse jwt')
      }
    });

    it('should fail with invalid nonce', function () {
      try {
        //@ts-expect-error
        validateIdToken(idToken, 'wrongNone', { issuer_metadata: { keys: {}}} )

      }catch (e) {
        expect(e).toBeInstanceOf(InvalidIdTokenError)
        expect(e.message).toBe(`Invalid nonce in id_token: ${expectedNonce}`)
      }
    });


    it('should fail with missing sub', function () {
      try {
        validateIdToken(createJWT({ payload: {nonce: expectedNonce}}),
          //@ts-expect-error
          expectedNonce, {
            issuer: expectedIssuer,
            audience: expectedAudience,
            currentTimeInMillis: expectedNow,
            clockSkew: 0,
            issuer_metadata: { keys: [rsaKey]}})

      }catch (e) {
        expect(e).toBeInstanceOf(InvalidIdTokenError)
        expect(e.message).toBe(`No Subject (sub) present in id_token`)

      }
    });

    it('should pass with correct id_token', function () {
      expect(
        validateIdToken(idToken,
          //@ts-expect-error
          expectedNonce, {
            issuer: expectedIssuer,
            audience: expectedAudience,
            currentTimeInMillis: expectedNow,
            clockSkew: 0,
            issuer_metadata: { keys: [rsaKey]}})
      ).toBeDefined()

    });
  })
});
