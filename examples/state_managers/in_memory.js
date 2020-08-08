import {StateStore} from "../../src/helpers";

export class InMemoryStateStore extends StateStore {
  map = new Map()

  clear( before) {
    if ( before ){
      this.map.forEach( ( val, ind ) => {
        if ( val.created_at < before ){
          this.map.delete( ind )
        }
      } )
      return Promise.resolve()
    } else {
      return Promise.resolve( this.map.clear() );
    }
  }

  del( key) {
    this.map.delete( key )
    return Promise.resolve();
  }

  get( key) {
    return Promise.resolve( this.map.get( key ) || null );
  }

  set( key, value ) {
    this.map.set( key, value )
    return Promise.resolve();
  }
}
