<template >
  <div class="user-profile-container">
    <pre><strong>User Profile:</strong> <code>{{ JSON.stringify(user, null, 2) }}</code></pre>
    <pre><strong>Access Token:</strong> <code>{{accessToken}}</code></pre>
    <pre><strong>Scopes:</strong> <code>{{scopes}}</code></pre>
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
    this.accessToken = await this.$auth.getAccessToken()
    this.scopes = await this.$auth.getScopes()
    this.user = await this.$auth.getUser()
  }
}
</script >

<style scoped >
</style >
