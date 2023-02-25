import { StateStore } from './state_store';

class WebStorageStateStore extends StateStore {
  storage: Storage;

  constructor( storage: Storage, prefix = 'pa_oidc.' ) {
    super( prefix )
    this.storage = storage;
  }

  get( key: string ) {
    return new Promise<Record<string, any> | null>( ( resolve ) => {
      const value = this.storage.getItem( this.prefix + key );
      if ( value ) {
        resolve( JSON.parse( value ) );
      } else {
        resolve( null );
      }
    } );
  }

  set( key: string, value: Record<string, any> ) {
    return new Promise<void>( ( resolve ) => {
      this.storage.setItem( this.prefix + key, JSON.stringify( value ) );
      resolve();
    } );
  }

  del( key: string ) {
    return new Promise<void>( ( resolve ) => {
      this.storage.removeItem( this.prefix + key );
      resolve();
    } );
  }

  clear( before?: number ): Promise<void> {
    return new Promise<void>( ( resolve ) => {
      let i;
      const storedKeys: string[] = [];
      for ( i = 0; i < this.storage.length; i++ ) {
        const key = this.storage.key( i )
        // items only created by oidc client
        if ( key?.substring( 0, this.prefix.length ) == this.prefix ) {
          storedKeys.push( key );
        }
      }
      for ( i = 0; i < storedKeys.length; i++ ) {
        if ( before ) {
          try {
            const storedItem = JSON.parse( this.storage.getItem( storedKeys[i] )! )
            if ( storedItem.created_at < before ) {
              this.storage.removeItem( storedKeys[i] )
            }
          } catch ( e ) {
          }
        } else {
          this.storage.removeItem( storedKeys[i] )
        }
      }
      resolve();
    } );
  }
}

export class LocalStorageStateStore extends WebStorageStateStore {
  constructor( prefix = 'pa_oidc.' ) {
    super( window.localStorage, prefix )
  }
}

export class SessionStorageStateStore extends WebStorageStateStore {
  constructor( prefix = 'pa_oidc.' ) {
    super( window.sessionStorage, prefix )
  }
}
