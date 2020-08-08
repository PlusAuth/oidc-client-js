import { SessionChecker, SessionCheckerOptions } from '../interfaces';

const DEFAULT_CHECK_INTERVAL = 2000

export function createSessionCheckerFrame( options: SessionCheckerOptions ): SessionChecker{
  const { url, callback, client_id, checkInterval } = options
  let internalSessionState: string | null;
  const idx = url.indexOf( '/', url.indexOf( '//' ) + 2 );
  const frameOrigin = url.substr( 0, idx );

  const frame = window.document.createElement( 'iframe' );

  frame.style.visibility = 'hidden';
  frame.style.position = 'absolute';
  frame.style.display = 'none';
  frame.style.width = '0';
  frame.style.height = '0';

  let timer: any

  const load = () => {
    return new Promise( resolve => {
      window.document.body.appendChild( frame );
      window.addEventListener( 'message', iframeEventHandler, false );
      frame.onload = () => {
        resolve()
      }
    } )
  }

  const start = ( sessionState: string ) => {
    load().then( () => {
      if ( sessionState && internalSessionState !== sessionState ) {
        stop();
        internalSessionState = sessionState;
        const send = () => {
          frame.contentWindow!.postMessage( `${ client_id } ${ internalSessionState }`, frameOrigin );
        };
        send();
        timer = window.setInterval( send, checkInterval || DEFAULT_CHECK_INTERVAL );
      }
    } )
  }

  const stop = () => {
    internalSessionState = null;
    if ( timer ) {
      window.clearInterval( timer );
      timer = null;
    }
  }

  const iframeEventHandler = ( e: MessageEvent ) => {
    if ( e.origin === frameOrigin && e.source === frame.contentWindow ) {
      if ( e.data === 'error' ) {
        stop();
      } else if ( e.data === 'changed' ) {
        stop();
        callback();
      }
    }
  }

  frame.setAttribute( 'src', url );

  return {
    stop,
    start
  }
}
