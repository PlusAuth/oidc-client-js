import { createApp } from "vue"
import App from "./App.vue"
import auth from "./auth"
import router from "./router.js"

const app = createApp(App)
app.config.globalProperties.$auth = auth
auth
  .initialize()
  .then(() => {})
  .catch(console.error)
  .finally(() => {
    app.use(router)
    app.mount("#app")
  })
