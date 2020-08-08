<template >
  <ul class="app-sidebar">
    <router-link tag="li" to="/public"><i class="fa fa-unlock-alt"></i>Public Page</router-link>
    <router-link tag="li" to="/secured"><i class="fa fa-lock"></i>Secured Page</router-link>
    <router-link tag="li" to="/me"><i class="fa fa-user"></i>User Profile</router-link>
  </ul>
</template >

<script >
export default {
  name: "AppSidebar"
}
</script >

<style scoped >
ul.app-sidebar {
  list-style-type: none;
  margin: 0;
  padding: 52px 0 0;
  width: 250px;
  height: 100%;
  position: fixed;
  box-shadow: 0 0 4px 0 rgba(0,0,0,0.75);
}

ul li {
  padding: 8px 0 8px 8px;
  cursor: pointer;
}

ul li:hover{
  background-color: #D0D0D0;
}
ul li.router-link-exact-active{
  background-color: #D0D0D0;

}
ul li i {
  padding-right: 4px;
}
ul li:not(:last-of-type){
  border-bottom: 1px solid;
}

</style >
