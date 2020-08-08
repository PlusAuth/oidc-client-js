export class PAError extends Error {
  error?: string;

  error_description?: string;
}

export class AuthenticationError extends PAError {
  state?: string;

  error_uri?: string;

  constructor( error: string, error_description?: string, state?: string, error_uri?: string ) {
    super( error_description || error );
    this.name = error_description ? error : 'AuthenticationError'
    this.error = error
    this.error_description = error_description
    this.state = state;
    this.error_uri = error_uri;
  }
}

export class InvalidJWTError extends PAError {
  constructor( details: string ) {
    super( details );
    this.name = 'InvalidJWTError'
    this.error_description = details
  }
}
export class InvalidIdTokenError extends InvalidJWTError {
  constructor( details: string ) {
    super( details );
    this.name = 'InvalidIdTokenError'
  }
}
