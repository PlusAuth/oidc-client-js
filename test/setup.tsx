const webCrypt = require("@peculiar/webcrypto")
const nodeCrypto = require("node:crypto")
const cryptModule = new webCrypt.Crypto()

global.self.crypto = window.crypto = cryptModule

let cryptoShim = cryptModule
Object.defineProperty(window, "crypto", {
  get() {
    return cryptoShim
  },
  set(v) {
    cryptoShim = v
  },
})

const x = require("node:util")
global.self.TextEncoder = window.TextEncoder = x.TextEncoder
// @ts-expect-error
global.self.NodeJsCrypto = window.NodeJsCrypto = nodeCrypto
