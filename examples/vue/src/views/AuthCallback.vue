<template >
<div></div>
</template >
<script >
export default {
  name: "AuthCallback",
  async mounted() {
    try{
    const localState = await this.$auth.loginCallback(window.location.href)
    if(localState && localState.location){
      window.location.replace(localState.location)
    }else{
      this.$router.replace('/')
    }
    }catch (e){
      console.error(e)
    }
  }
}
</script >

<style scoped >

</style >
