import * as VueRouter from 'vue-router'
import Home from './views/Home.vue'
import AuthCallback from './views/AuthCallback.vue'
import UserProfile from "./views/UserProfile.vue";
import Secured from "./views/Secured.vue";
import Public from "./views/Public.vue";
import Unauthorized from "./views/Unauthorized.vue";
import NotFound from "./views/NotFound.vue";

import auth from "./auth.js";

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/secured',
    meta: {
      auth: 'secure'
    },
    name: 'SecuredPage',
    component: Secured
  },
  {
    path: '/public',
    name: 'PublicPage',
    component: Public
  },
  {
    path: '/me',
    name: 'UserProfile',
    component: UserProfile
  },
  {
    path: '/callback',
    name: 'AuthCallback',
    component: AuthCallback
  },
  {
    path: '/401',
    name: 'Unauthorized',
    component: Unauthorized
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory('/'),
  routes,
})

router.beforeEach( async (to, from, next) => {
  if(to.meta.auth){
    if (await auth.isLoggedIn(true)){
      const scopes = await auth.getScopes()
      if(scopes.includes(to.meta.auth)){
        return next()
      }else{
        return next({ name: 'Unauthorized'})
      }
    }else {
      return next({ name: 'Unauthorized'})
    }
  }
  return next()
})
export default router
