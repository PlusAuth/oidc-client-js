<template >

</template >

<script >
import {OIDCClient} from "../../../../";

export default {
  name: "SilentRenew",
  async mounted() {
    await new OIDCClient({
      issuer: import.meta.env.VITE_OIDC_ISSUER,
    }).loginCallback();
  }
}
</script >

<style scoped >

</style >
