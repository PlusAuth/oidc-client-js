export const isResponseType = ( type: string, response_type?: string ) =>
  response_type && response_type.split( /\s+/g ).filter( rt => rt === type ).length > 0
