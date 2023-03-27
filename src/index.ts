import { OIDCClient } from './client';
import type { IPlusAuthClientOptions } from './interfaces';

export * from './interfaces'
export * from './client'
export * from './constants'
export * from './helpers'
export * from './errors'

/**
 * Create OIDC client with initializing it. It resolves issuer metadata, jwks keys and check if user is
 * authenticated in OpenId Connect provider.
 */
export default function createOIDCClient( options: IPlusAuthClientOptions ): Promise<OIDCClient>{
  return new OIDCClient( options ).initialize()
}
