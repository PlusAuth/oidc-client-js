import Vue from "vue"
import VueRouter from "vue-router"
import NotFound from "@/views/NotFound"
import Public from "@/views/Public"
import Secured from "@/views/Secured"
import Unauthorized from "@/views/Unauthorized"
import UserProfile from "@/views/UserProfile"
import auth from "./auth"
import AuthCallback from "./views/AuthCallback.vue"
import Home from "./views/Home.vue"

Vue.use(VueRouter)

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
    path: "/401",
    name: "Unauthorized",
    component: Unauthorized,
  },
  {
    path: "*",
    name: "NotFound",
    component: NotFound,
  },
]

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
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
