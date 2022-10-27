const webCrypt = require("@peculiar/webcrypto");
const cryptModule = new webCrypt.Crypto();
global.self["crypto"] = window["crypto"] = cryptModule

Object.defineProperty(window, 'crypto', {
  get(){
    return cryptModule
  }
})

const x = require('util');
global.self["TextEncoder"] = window["TextEncoder"] = x.TextEncoder;
