<template >
  <div class="user-profile-container">
    <pre><strong>User Profile:</strong> <code>{{ JSON.stringify(user, null, 2) }}</code></pre>
    <div>
      <strong>Access Token:</strong> <code>{{accessToken}}</code>
    </div>
    <div>
      <strong>Refresh Token:</strong> <code>{{refreshToken}}</code>
    </div>
    <div>
      <pre><strong>Scopes:</strong> <code>{{scopes}}</code></pre>
    </div>

    <button @click="silentRenew">Silently Refresh</button>
  </div>
</template >

<script >
export default {
  name: "UserProfile",
  data() {
    return {
      user: null,
      accessToken: null,
      scopes: null,
    }
  },
  async created(){
    this.$auth.on("user_login", async (auth)=>{
      this.accessToken = await this.$auth.getAccessToken()
      this.refreshToken = await this.$auth.getRefreshToken()
      this.scopes = await this.$auth.getScopes()
      this.user = await this.$auth.getUser()
    })
    this.accessToken = await this.$auth.getAccessToken()
    this.refreshToken = await this.$auth.getRefreshToken()
    this.scopes = await this.$auth.getScopes()
    this.user = await this.$auth.getUser()
  },
  methods: {
   async silentRenew() {
      await this.$auth.silentLogin()
    }
  },
}
</script >

<style scoped >
</style >
