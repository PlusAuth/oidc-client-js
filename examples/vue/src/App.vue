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
import AppHeader from "@/components/AppHeader"
import AppSidebar from "@/components/AppSidebar"
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
  },
}
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
  padding: 8px;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

main{
  padding-top: 52px;
  padding-left: 250px;
}

.container {
  padding: 16px;
}

</style>
