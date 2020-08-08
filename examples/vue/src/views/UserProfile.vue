<template >
  <div class="user-profile-container">
    <pre><strong>User Profile:</strong> <code>{{ JSON.stringify(user, null, 2) }}</code></pre>
    <pre><strong>Access Token:</strong> <code>{{accessToken}}</code></pre>
    <pre><strong>Scopes:</strong> <code>{{scope}}</code></pre>
  </div>
</template >

<script >
export default {
  name: "UserProfile",
  data() {
    return {
      user: null,
      accessToken: null,
      scope: null,
    }
  },
  async created(){
    this.accessToken = await this.$auth.getAccessToken()
    this.scope = await this.$auth.getScope()
    this.user = await this.$auth.getUser()
  }
}
</script >

<style scoped >
</style >
