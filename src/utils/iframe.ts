import { AuthenticationError, OIDCClientError } from '../errors';
import { IFrameOptions } from '../interfaces';

export function createHiddenFrame() {
  const iframe = window.document.createElement( 'iframe' );
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.position = 'absolute';
  iframe.style.visibility = 'hidden';
  iframe.style.display = 'none';

  return iframe
}

export function runIframe(
  url: string,
  options: IFrameOptions
) {
  return new Promise<any>( ( resolve, reject ) => {
    const iframe = createHiddenFrame()

    const removeIframe = () => {
      if ( window.document.body.contains( iframe ) ) {
        window.document.body.removeChild( iframe );
      }
    };

    const timeoutSetTimeoutId = setTimeout( () => {
      reject( new OIDCClientError( 'Timed out' ) );
      removeIframe();
    }, options.timeout || 60 * 1000 );

    const iframeEventHandler = function ( e: MessageEvent ) {
      if ( e.origin != options.eventOrigin ) return;
      if ( !e.data || e.data.type !== 'authorization_response' ) return;
      const eventSource = e.source;
      if ( eventSource ) {
        ( <any>eventSource ).close();
      }

      const resp = e.data.response || e.data
      resp.error
        ? reject( new AuthenticationError( resp.error, resp.error_description, resp.state, resp.error_uri ) )
        : resolve( e.data );
      clearTimeout( timeoutSetTimeoutId );
      window.removeEventListener( 'message', iframeEventHandler, false );
      // Delay the removal of the iframe to prevent hanging loading status
      setTimeout( removeIframe, 2000 );
    };
    window.addEventListener( 'message', iframeEventHandler, false );
    window.document.body.appendChild( iframe );
    iframe.setAttribute( 'src', url );
    const frameLoadCount = 0
    let firstURL: string
    iframe.onload = function (){
      if ( frameLoadCount === 0 ) {
        firstURL = iframe.getAttribute( 'src' ) as string;
      } else {
        if ( firstURL !== iframe.getAttribute( 'src' ) ) {
          reject()
        }
      }
    }
  } );
}
