<template>
  <div class="app-header">
    <router-link style="cursor: pointer; padding: 8px" tag="span" to="/"><i class="fa fa-home fa-2x"></i></router-link>

    <div class="profile-box">
      <template  v-if="!user" >
        <button @click="$auth.login({extraParams: { invitePid: Math.random()}, prompt: 'signup'})" class="login-btn" title="Login with Popup">Signup</button>
        <button @click="$auth.loginWithPopup()" class="login-btn" title="Login with Popup">Login with
          Popup</button>
        <button @click="$auth.login()" class="login-btn" title="Login"> Login </button>
      </template>
      <template v-else>
        <router-link to="/me">{{ userDisplayName }}</router-link>
        <i @click="$auth.logout()" title="logout" class="logout-btn fa fa-sign-out fa-2x"></i>
      </template>
    </div>
  </div>
</template>

<script >
export default {
  name: "AppHeader",
  data() {
    return {
      user: null
    }
  },
  computed: {
    userDisplayName() {
      if(!this.user){
        return null
      }else{
        if(!this.user.given_name || !this.user.family_name){
          return this.user.username || this.user.email || this.user.sub
        }
        return `${this.user.given_name} ${this.user.family_name}`
      }
    }
  },
  async created(){
    this.$auth.on('user_login', ({ user }) => {
      this.user = user
    })
    this.$auth.on('user_logout', () => {
      this.user = null
    })
    this.user = await this.$auth.getUser()
  }
}
</script >

<style scoped >
.app-header {
  position: fixed;
  display: flex;
  align-items: center;
  top: 0;
  height: 52px;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0px 1px 3px 0px rgba(0,0,0,0.75);
  background: #fff;
}

.profile-box {
  justify-self: end;
  display: flex;
  margin-left: auto;
  flex-direction: row;
  align-items: center;
  padding: 0 12px;
}

.profile-box a {
  text-decoration: none;
  color: black;
  padding: 0 4px;
}
.login-btn {
  display: block;
  padding: 4px;
  border: 1px solid #424242;
  border-radius: 3px;
  cursor: pointer;
  color: black;
  margin: 2px;
}
.logout-btn {
  display: inline-block;
  cursor: pointer;
  color: #e53935;
}
</style >
