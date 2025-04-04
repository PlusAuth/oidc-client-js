import Vue from "vue"
import App from "./App.vue"
import auth from "./auth"
import router from "./router"
import "./assets/main.css"

Vue.prototype.$auth = auth

auth
  .initialize()
  .then(() => {
    new Vue({
      router,
      render: (h) => h(App),
    }).$mount("#app")
  })
  .catch(console.error)
Vue.config.productionTip = false
