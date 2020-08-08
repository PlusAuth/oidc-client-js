const webCrypt = require("@peculiar/webcrypto");
const cryptModule = new webCrypt.Crypto();

global["crypto"] = cryptModule

const x = require('util');
global["TextEncoder"] = x.TextEncoder;
