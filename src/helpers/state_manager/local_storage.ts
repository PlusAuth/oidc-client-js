import { StateStore } from './state_store';

export class LocalStorageStateStore extends StateStore {
  constructor( prefix = 'pa_oidc.' ) {
    super( prefix )
  }

  get( key: string ) {
    return new Promise<Record<string, any> | null>( ( resolve, reject ) => {
      const value = window.localStorage.getItem( this.prefix + key );
      if ( value ) {
        resolve( JSON.parse( value ) );
      } else {
        resolve( null );
      }
    } );
  }

  set( key: string, value: Record<string, any> ) {
    return new Promise<void>( ( resolve, reject ) => {
      window.localStorage.setItem( this.prefix + key, JSON.stringify( value ) );
      resolve();
    } );
  }

  del( key: string ) {
    return new Promise<void>( ( resolve, reject ) => {
      window.localStorage.removeItem( this.prefix + key );
      resolve();
    } );
  }

  clear( before?: number ): Promise<void> {
    return new Promise<void>( ( resolve, reject ) => {
      let i;
      const arr: string[] = []; // Array to hold the keys
      for ( i = 0; i < window.localStorage.length; i++ ) {
        const key = window.localStorage.key( i )
        if ( key?.substring( 0, this.prefix.length ) == this.prefix ) {
          arr.push( key );
        }
      }
      for ( i = 0; i < arr.length; i++ ) {
        if ( before ) {
          try {
            const storedItem = JSON.parse( window.localStorage.getItem( arr[i] )! )
            if ( storedItem.created_at < before ) {
              window.localStorage.removeItem( arr[i] )
            }
          } catch ( e ) {
          }
        } else {
          window.localStorage.removeItem( arr[i] )
        }
      }
      resolve();
    } );
  }
}
