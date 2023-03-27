import { AuthenticationError, OIDCClientError } from '../errors';
import type { IFrameOptions } from '../interfaces';

export function createHiddenFrame() {
  const iframe = window.document.createElement( 'iframe' );
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.position = 'absolute';
  iframe.style.visibility = 'hidden';
  iframe.style.display = 'none';

  iframe.title = '__pa_helper__hidden'
  iframe.ariaHidden = 'true'

  return iframe
}

export function runIframe(
  url: string,
  options: IFrameOptions
) {
  return new Promise<any>( ( resolve, reject ) => {
    let onLoadTimeoutId: any = null;
    const iframe = createHiddenFrame()

    const timeoutSetTimeoutId = setTimeout( () => {
      reject( new OIDCClientError( 'Timed out' ) );
      removeIframe();
    }, ( options.timeout || 10 ) * 1000 );

    const iframeEventHandler =  ( e: MessageEvent ) => {
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
      removeIframe();
    };

    const removeIframe = () => {
      if ( onLoadTimeoutId != null ){
        clearTimeout( onLoadTimeoutId )
      }
      if ( window.document.body.contains( iframe ) ) {
        window.document.body.removeChild( iframe );
      }
      window.removeEventListener( 'message', iframeEventHandler, false );
    };

    const onLoadTimeout = () => setTimeout( ()=>{
      reject( new OIDCClientError( 'Could not complete silent authentication', url ) )
      removeIframe();
    }, 300 )



    window.addEventListener( 'message', iframeEventHandler, false );
    window.document.body.appendChild( iframe );
    iframe.setAttribute( 'src', url );

    /**
     * In case of wrong client id, wrong redirect_uri, in short when redirect did not happen
     * we assume flow failed.
     */
    iframe.onload = function () {
      onLoadTimeoutId = onLoadTimeout()
    }
  } );
}
