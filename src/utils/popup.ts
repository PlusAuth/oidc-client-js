import { OIDCClientError } from '../errors';
import { PopupOptions } from '../interfaces';

const openPopup = ( url: string, width = 400, height = 600 ) => {
  const left = window.screenX + ( window.innerWidth - width ) / 2;
  const top = window.screenY + ( window.innerHeight - height ) / 2;

  return window.open(
    url,
    'oidc-login-popup',
    `left=${ left },top=${ top },width=${ width },height=${ height },resizable,scrollbars=yes,status=1`
  );
};

export function runPopup( url: string, options: PopupOptions ) {
  let popup = options.popup;

  if ( popup ) {
    popup.location.href = url;
  } else {
    popup = openPopup( url );
  }

  if ( !popup ) {
    /* istanbul ignore next */
    throw new Error( 'Could not open popup' );
  }

  return new Promise<any>( ( resolve, reject ) => {
    const timeoutId = setTimeout( () => {
      reject( new OIDCClientError( 'Timed out' ) );
    }, options.timeout || 60 * 1000 );
    window.addEventListener( 'message', e => {
      if ( !e.data || e.data.type !== 'authorization_response' ) return;
      clearTimeout( timeoutId );
      popup!.close();
      e.data.error || e.data.response?.error
        ? reject( new OIDCClientError( e.data ) )
        : resolve( e.data );
    } );
  } );
}
