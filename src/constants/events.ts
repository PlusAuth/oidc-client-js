/* eslint-disable @typescript-eslint/indent */
export const Events = {
  USER_LOGOUT:          'user_logout',
  USER_LOGIN:           'user_login',
  SILENT_RENEW_SUCCESS: 'silent_renew_success',
  SILENT_RENEW_ERROR:   'silent_renew_error',
  SESSION_CHANGE:       'session_change',
  SESSION_ERROR:        'session_error',
} as const

export type EventTypes = 'user_logout' | 'user_login' | 'silent_renew_success' |
                          'silent_renew_error' | 'session_change' | 'session_error'
