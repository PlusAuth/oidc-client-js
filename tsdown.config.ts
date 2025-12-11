import { readFileSync } from "node:fs"
import { defineConfig } from "tsdown"

const pkg = JSON.parse(readFileSync("./package.json", "utf8"))

const year = new Date(
  process.env.SOURCE_DATE_EPOCH ? Number(process.env.SOURCE_DATE_EPOCH) * 1000 : Date.now(),
).getFullYear()

const banner = `/*!
 * @plusauth/oidc-client-js v${pkg.version}
 * ${pkg.homepage}
 * (c) ${year} @plusauth/oidc-client-js Contributors
 * Released under the MIT License
 */`

export default defineConfig([
  // UMD build (minified)
  {
    entry: "src/index.ts",
    format: "umd",
    outputOptions: {
      name: "PlusAuthOIDCClient",
      file: pkg.browser,
    },
    sourcemap: true,
    minify: true,
    banner,
    target: "es2020",
    platform: "browser",
  },

  // ESM build
  {
    entry: {
      "oidc-client": "src/index.ts",
    },
    dts: {
      sourcemap: false,
    },
    format: "esm",
    sourcemap: false,
    minify: false,
    banner,
    target: "es2020",
    platform: "browser",
  },
])
