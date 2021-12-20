import { fromByteArray } from 'base64-js';

export function isValidIssuer( issuer: string ){
  try {
    const url = new URL( issuer )
    if ( !['http:', 'https:'].includes( url.protocol ) ){
      return false
    }
    if ( url.search !== '' || url.hash !== '' ){
      return false
    }
    return true
  } catch ( e ){
    return false
  }
}
export function buildEncodedQueryString( obj?: Record<string, string | number | undefined | null>,
                                         appendable = true, ) {
  if ( !obj ) return '';
  const ret: string[] = [];
  for ( const d in obj ) {
    if ( obj.hasOwnProperty( d ) && obj[d] ) {
      ret.push( `${ encodeURIComponent( d ) }=${ encodeURIComponent( obj[d]! ) }` );
    }
  }
  return `${ appendable ? '?' : '' }${ ret.join( '&' ) }`;
}

export function parseQueryUrl( value: string ) {
  const result: Record<string, string> = {};
  value = value.trim().replace( /^(\?|#|&)/, '' );
  const params = value.split( '&' );
  for ( let i = 0; i < params.length; i += 1 ) {
    const paramAndValue = params[i];
    const parts = paramAndValue.split( '=' );
    const key = decodeURIComponent( parts.shift()! );
    const value = parts.length > 0 ? parts.join( '=' ) : '';
    result[key] = decodeURIComponent( value );
  }
  return result;
}

export function urlSafe( buffer: Uint8Array ): string {
  const encoded = fromByteArray( new Uint8Array( buffer ) );
  return encoded.replace( /\+/g, '-' ).replace( /\//g, '_' ).replace( /=/g, '' );
}
