module.exports = {
  lintOnSave: false,
  configureWebpack: {
    target: "web",
  },
  pages: {
    app: {
      entry: "src/main.js",
      template: "public/index.html",
      filename: "index.html",
      excludeChunks: ["silent-renew"],
    },
    silentrenew: {
      entry: "src/silent-renew.js",
      template: "public/silent-renew.html",
      filename: "silent-renew.html",
      excludeChunks: ["app"],
    },
  },
}
