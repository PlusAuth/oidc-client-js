<template>
  <div>
    <AppHeader></AppHeader>
    <AppSidebar></AppSidebar>
    <main>
      <div class="container">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from "./components/AppHeader.vue"
import AppSidebar from "./components/AppSidebar.vue"
export default {
  name: "App",
  components: { AppSidebar, AppHeader },
  data() {
    return {
      user: null,
    }
  },
  async beforeCreate() {
    this.user = await this.$auth.getUser()
  },
  mounted() {
    this.$auth.on("user_login", ({ user }) => {
      this.user = user
    })
    this.$auth.on("silent_renew_error", console.error)
  },
}
</script>
<style>
html, body{
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

main{
  padding-top: 52px;
  padding-left: 250px;
}

.container {
  padding: 16px;
}

</style>
