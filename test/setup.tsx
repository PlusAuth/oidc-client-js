const webCrypt = require("@peculiar/webcrypto")
const cryptModule = new webCrypt.Crypto()
global.self["crypto"] = window["crypto"] = cryptModule

Object.defineProperty(window, "crypto", {
  get() {
    return cryptModule
  },
})

const x = require("node:util")
global.self["TextEncoder"] = window["TextEncoder"] = x.TextEncoder
