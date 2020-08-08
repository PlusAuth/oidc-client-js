export const Events = {
  USER_LOGOUT: 'user_logout',
  USER_LOGIN:  'user_login',
} as const

export type EventTypes = 'user_logout' | 'user_login'
