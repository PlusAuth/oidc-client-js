import { InvalidIdTokenError, InvalidJWTError, OIDCClientError } from '../errors';
import { IPlusAuthClientOptions, JWTValidationOptions, ParsedJWT } from '../interfaces';

import { urlSafe } from './url';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function getRandomBytes( n: number ){
  // @ts-ignore
  const crypto = self.crypto || self.msCrypto, QUOTA = 65536;
  const a = new Uint8Array( n );
  for ( let i = 0; i < n; i += QUOTA ) {
    crypto.getRandomValues( a.subarray( i, i + Math.min( n - i, QUOTA ) ) );
  }
  return a;
}

export function generateRandom( length: number ){
  let out = '';
  const charsLen = CHARSET.length;
  const maxByte = 256 - 256 % charsLen;
  while ( length > 0 ) {
    const buf = getRandomBytes( Math.ceil( length * 256 / maxByte ) );
    for ( let i = 0; i < buf.length && length > 0; i++ ) {
      const randomByte = buf[i];
      if ( randomByte < maxByte ) {
        out += CHARSET.charAt( randomByte % charsLen );
        length--;
      }
    }
  }
  return out;
}


export function deriveChallenge( code: string ): Promise<string>{
  if ( code.length < 43 || code.length > 128 ) {
    return Promise.reject( new OIDCClientError( `Invalid code length: ${ code.length }` ) );
  }

  return new Promise( ( resolve, reject ) => {
    crypto.subtle.digest( 'SHA-256', new TextEncoder().encode( code ) )
      .then( buffer => {
        return resolve( urlSafe( new Uint8Array( buffer ) ) );
      }, function ( error ) {
        /* istanbul ignore next */
        return reject( error );
      } );
  } );
}
// https://datatracker.ietf.org/doc/html/rfc4648#section-5
export const urlDecodeB64 = ( input: string ) => decodeURIComponent(
  atob( input.replace( /_/g, '/' ).replace( /-/g, '+' ) )
    .split( '' )
    .map( c => {
      return `%${ `00${ c.charCodeAt( 0 ).toString( 16 ) }`.slice( -2 ) }`;
    } )
    .join( '' )
);



export function parseJwt( jwt: string ): ParsedJWT {
  try {
    const parts = jwt.split( '.' )
    if ( parts.length !== 3 ){
      throw new Error( 'Wrong JWT format' )
    }
    return {
      header:  JSON.parse( urlDecodeB64( parts[0] ) ),
      payload: JSON.parse( urlDecodeB64( parts[1] ) )
    }
  } catch ( e ){
    throw new InvalidJWTError( 'Failed to parse jwt' )
  }
}

export function validateIdToken( id_token: string, nonce: string, options: IPlusAuthClientOptions ) {
  if ( !nonce ) {
    throw new OIDCClientError( 'No nonce on state' );
  }

  try {
    const jwt = parseJwt( id_token );

    if ( nonce !== jwt.payload.nonce ) {
      throw new Error( `Invalid nonce in id_token: ${ jwt.payload.nonce }` );
    }

    validateJwt( id_token, options, true )

    // @ts-ignore
    if ( !jwt.payload['sub'] ) {
      throw new Error( 'No Subject (sub) present in id_token' );
    }

    return jwt.payload;
  } catch ( e ){
    throw new InvalidIdTokenError( e.message )
  }
}

export function validateJwt( jwt: string, options: JWTValidationOptions, isIdToken = false ) {
  // eslint-disable-next-line prefer-const
  let { clockSkew, currentTimeInMillis, issuer, audience, client_id } = options
  if ( !clockSkew ){
    clockSkew = 0
  }
  const now = ( currentTimeInMillis && currentTimeInMillis() || Date.now() ) / 1000;

  const payload = parseJwt( jwt ).payload;

  if ( !payload.iss ) {
    throw new InvalidJWTError( 'Issuer (iss) was not provided' );
  }
  if ( payload.iss !== issuer ) {
    throw new InvalidJWTError( `Invalid Issuer (iss) in token: ${ payload.iss }` );
  }

  if ( !payload.aud ) {
    throw new InvalidJWTError( 'Audience (aud) was not provided' );
  }

  // Audience must be equal to client_id in id_token
  // https://openid.net/specs/openid-connect-core-1_0.html#IDToken
  if ( Array.isArray( payload.aud ) ?
    payload.aud.indexOf( isIdToken ? client_id : audience || client_id ) == -1 :
    payload.aud !== ( isIdToken ? client_id : audience || client_id )
  ) {
    throw new InvalidJWTError( `Invalid Audience (aud) in token: ${ payload.aud }` );
  }

  if ( payload.azp && payload.azp !== client_id ) {
    throw new InvalidJWTError( `Invalid Authorized Party (azp) in token: ${ payload.azp }` );
  }

  const lowerNow = Math.ceil( now + clockSkew );
  const upperNow = Math.floor( now - clockSkew );

  if ( !payload.iat ) {
    throw new InvalidJWTError( 'Issued At (iat) was not provided' );
  }

  if ( lowerNow < payload.iat ) {
    throw new InvalidJWTError( `Issued At (iat) is in the future: ${ payload.iat }` );
  }

  if ( payload.nbf && lowerNow < payload.nbf ) {
    throw new InvalidJWTError( `Not Before time (nbf) is in the future: ${ payload.nbf }` );
  }

  if ( !payload.exp ) {
    throw new InvalidJWTError( 'Expiration Time (exp) was not provided' );
  }
  if ( payload.exp < upperNow ) {
    throw new InvalidJWTError( `Expiration Time (exp) is in the past: ${ payload.exp }` );
  }

  return payload;
}

// Retrieved from https://www.iana.org/assignments/jwt/jwt.xhtml
export const nonUserClaims = [
  'iss',
  // 'sub',
  'aud',
  'exp',
  'nbf',
  'iat',
  'jti',
  'azp',
  'nonce',
  'auth_time',
  'at_hash',
  'c_hash',
  'acr',
  'amr',
  'sub_jwk',
  'cnf',
  'sip_from_tag',
  'sip_date',
  'sip_callid',
  'sip_cseq_num',
  'sip_via_branch',
  'orig',
  'dest',
  'mky',
  'events',
  'toe',
  'txn',
  'rph',
  'sid',
  'vot',
  'vtm',
  'attest',
  'origid',
  'act',
  'scope',
  'client_id',
  'may_act',
  'jcard',
  'at_use_nbr',
] as const
