import * as VueRouter from "vue-router"
import AuthCallback from "./views/AuthCallback.vue"
import Home from "./views/Home.vue"
import NotFound from "./views/NotFound.vue"
import Public from "./views/Public.vue"
import Secured from "./views/Secured.vue"
import SilentRenew from "./views/SilentRenew.vue"
import Unauthorized from "./views/Unauthorized.vue"
import UserProfile from "./views/UserProfile.vue"

import auth from "./auth.js"

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/secured",
    meta: {
      auth: "secure",
    },
    name: "SecuredPage",
    component: Secured,
  },
  {
    path: "/public",
    name: "PublicPage",
    component: Public,
  },
  {
    path: "/me",
    name: "UserProfile",
    component: UserProfile,
  },
  {
    path: "/callback",
    name: "AuthCallback",
    component: AuthCallback,
  },
  {
    path: "/silent-renew.html",
    name: "SilentRenew",
    component: SilentRenew,
  },
  {
    path: "/401",
    name: "Unauthorized",
    component: Unauthorized,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
  },
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory("/"),
  routes,
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.auth) {
    if (await auth.isLoggedIn(true)) {
      const scopes = await auth.getScopes()
      if (scopes.includes(to.meta.auth)) {
        return next()
      }
      return next({ name: "Unauthorized" })
    }
    return next({ name: "Unauthorized" })
  }
  return next()
})
export default router
