import { buildEncodedQueryString } from './url';

export interface RequestOptions {
  body?: Record<string, string | number | null | undefined>;
  headers?: Record<string, string>,
  method: 'GET' | 'POST' | 'PATCH' | 'TRACE' | 'OPTIONS' | 'HEAD',
  requestType?: 'form' | 'json',
  url: string
}

export function request( options: RequestOptions ): Promise<any>{
  let body: any = null
  let headers = options.headers || {}
  if ( options.method === 'POST' ){
    headers = {
      'Content-Type': options.requestType === 'form' ? 'application/x-www-form-urlencoded;charset=UTF-8' :
        'application/json;charset=UTF-8',
      ...headers
    }
  }
  if ( options.body ){
    body = options.requestType === 'form' ? buildEncodedQueryString( options.body, false )
      : JSON.stringify( options.body )
  }

  return new Promise( ( resolve, reject ) => {
    fetch( options.url, {
      method: options.method,
      body:   body,
      headers
    } )
      .then( ( value: Response ) => resolve( value.json() ) )
      .catch( reject )
  } )
}
