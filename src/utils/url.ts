import { fromByteArray } from 'base64-js';

export function isValidOrigin( origin: string ){
  // eslint-disable-next-line max-len
  return /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+@]*)?$/.test( origin )
}
export function buildEncodedQueryString( obj?: Record<string, string | number | undefined | null>,
                                         appendable = true, ) {
  if ( !obj ) return '';
  const ret = [];
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
