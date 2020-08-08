export type Listener = ( ...args: any ) => void

export class EventEmitter<T extends string>{
  callbacks: Record<string, any[] >;

  constructor(){
    this.callbacks = {}
  }

  once( event: T, fn: ( ...args: any[] ) => void ){
    function on( this: EventEmitter<any>, ...onArgs: any[] ) {
      this.off( event, on );
      fn.apply( this, onArgs );
    }
    on.fn = fn
    this.on( event, on );
    return this;
  }

  on( event: T, cb: ( ...args: any[] ) => void ){
    if ( !this.callbacks[`$${ event }`] ) this.callbacks[`$${ event }`] = [];
    this.callbacks[`$${ event }`].push( cb )
    return this
  }

  off( event?: T, fn?: ( ...args: any[] ) => void ){
    if ( !event ) {
      this.callbacks = {};
      return this;
    }

    // specific event
    const callbacks = this.callbacks[`$${ event }`];
    if ( !callbacks ) return this;

    // remove all handlers
    if ( !fn ) {
      delete this.callbacks[`$${ event }`];
      return this;
    }

    for ( let i = 0; i < callbacks.length; i++ ) {
      const cb = callbacks[i];
      if ( cb === fn || cb.fn === fn ) {
        callbacks.splice( i, 1 );
        break;
      }
    }

    // Remove event specific arrays for event types that no
    // one is subscribed for to avoid memory leak.
    if ( callbacks.length === 0 ) {
      delete this.callbacks[`$${ event }`];
    }

    return this;
  }

  emit( event: T, ...args: any[] ){
    let cbs = this.callbacks[`$${ event }`]
    if ( cbs ) {
      cbs = cbs.slice( 0 );
      for ( let i = 0, len = cbs.length; i < len; ++i ) {
        cbs[i].apply( this, args );
      }
    }
    return this
  }
}
