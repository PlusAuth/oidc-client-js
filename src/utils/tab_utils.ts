/*
Jitbit TabUtils - helper for multiple browser tabs. version 1.0
https://github.com/jitbit/TabUtils
- executing "interlocked" function call - only once per multiple tabs
- broadcasting a message to all tabs (including the current one) with some message "data"
- handling a broadcasted message
MIT license: https://github.com/jitbit/TabUtils/blob/master/LICENSE
*/

const keyPrefix = '__pa_oidc__';
const currentTabId = `${ performance.now() }:${ Math.random() * 1000000000 | 0 }`;
const handlers: Record<string, any> = {};

export class TabUtils {
  //runs code only once in multiple tabs
  //the lock holds for 4 seconds (in case the function is async and returns right away, for example, an ajax call intiated)
  //then it is cleared
  static CallOnce( lockname: string, fn: () => void, timeout = 3000 ): void{
    if ( !lockname ) throw 'empty lockname';

    if ( !window.localStorage ) { //no local storage. old browser. screw it, just run the function
      fn();
      return;
    }

    const localStorageKey = keyPrefix + lockname;

    localStorage.setItem( localStorageKey, currentTabId );
    //re-read after a delay (after all tabs have saved their tabIDs into ls)
    setTimeout( () => {
      if ( localStorage.getItem( localStorageKey ) == currentTabId )
        fn();
    }, 150 );

    //cleanup - release the lock after 3 seconds and on window unload (just in case user closed the window while the lock is still held)
    setTimeout( function () { localStorage.removeItem( localStorageKey ); }, timeout );
  }

  static BroadcastMessageToAllTabs( messageId: string, eventData: any ): void{
    if ( !window.localStorage ) return; //no local storage. old browser

    const data = {
      data:      eventData,
      timeStamp: new Date().getTime()
    }; //add timestamp because overwriting same data does not trigger the event

    //this triggers 'storage' event for all other tabs except the current tab
    localStorage.setItem( `${ keyPrefix }event${ messageId }`, JSON.stringify( data ) );

    //now we also need to manually execute handler in the current tab too, because current tab does not get 'storage' events
    try { handlers[messageId]( eventData ); } //"try" in case handler not found
    catch ( x ) { }

    //cleanup
    setTimeout( () => { localStorage.removeItem( `${ keyPrefix }event${ messageId }` ); }, 3000 );
  }

  static OnBroadcastMessage( messageId: string, fn: ( data: any ) => void ): void{
    if ( !window.localStorage ) return; //no local storage. old browser

    //first register a handler for "storage" event that we trigger above
    window.addEventListener( 'storage', ( ev ) => {
      if ( ev.key != `${ keyPrefix }event${ messageId }` ) return; // ignore other keys
      if ( !ev.newValue ) return; //called by cleanup?
      const messageData = JSON.parse( ev.newValue );
      fn( messageData.data );
    } );

    //second, add callback function to the local array so we can access it directly
    handlers[messageId] = fn;
  }
}
