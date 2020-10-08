export interface StateStore {
  init?(): Promise<StateStore>
}
export abstract class StateStore {
  prefix: string;

  constructor( prefix = '' ) {
    this.prefix = prefix
  }

  public abstract get( key: string ): Promise<Record<string, any> | null>;

  public abstract set( key: string, value: Record<string, any> ): Promise<void>;

  public abstract del( key: string ): Promise<void>;

  public abstract clear( maxAge?: number ): Promise<void>;
}
