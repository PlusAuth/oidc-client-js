export const isResponseType = (type: string, response_type?: string) =>
  response_type && response_type.split(/\s+/g).filter((rt) => rt === type).length > 0

export const isScopeIncluded = (scope: string, scopes?: string) =>
  scopes && scopes.split(" ").indexOf(scope) > -1
