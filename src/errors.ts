export class OIDCClientError extends Error {
  error: string

  error_description?: string

  public constructor(error: string, error_description?: string) {
    super(`${error}${(error_description && ` - ${error_description}`) || ""}`)
    this.name = "OIDCClientError"
    this.error = error
    this.error_description = error_description
  }
}

export class AuthenticationError extends OIDCClientError {
  state?: string

  error_uri?: string

  constructor(error: string, error_description?: string, state?: string, error_uri?: string) {
    super(error, error_description)
    this.name = "AuthenticationError"
    this.state = state
    this.error_uri = error_uri
  }
}

export class StateNotFound extends AuthenticationError {
  state?: string

  constructor(error: string, state?: string) {
    super(error)
    this.name = "StateNotFound"
    this.state = state
  }
}

export class InvalidJWTError extends OIDCClientError {
  constructor(details: string) {
    super(details)
    this.name = "InvalidJWTError"
    this.error_description = details
  }
}

export class InvalidIdTokenError extends InvalidJWTError {
  constructor(details: string) {
    super(details)
    this.name = "InvalidIdTokenError"
  }
}

export class InteractionCancelled extends OIDCClientError {
  constructor(details: string) {
    super(details)
    this.name = "InteractionCancelled"
  }
}
