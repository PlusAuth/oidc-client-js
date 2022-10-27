import {createApp} from 'vue'
import App from './App.vue'
import router from "./router.js";
import auth from "./auth";

const app = createApp(App)
app.config.globalProperties.$auth = auth
auth.initialize().then( () => {
}).catch(console.error).finally(() => {
  app.use(router)
  app.mount('#app')
})
