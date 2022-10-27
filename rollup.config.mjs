import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import {swc, minify} from 'rollup-plugin-swc3';
import dts from 'rollup-plugin-dts';
import {readFileSync} from 'fs';

const {version, homepage, browser, module, types} = JSON.parse(readFileSync('./package.json'));

const banner = `/*!
 * @plusauth/oidc-client-js v${version}
 * ${homepage}
 * (c) ${(new Date(process.env.SOURCE_DATE_EPOCH ? (process.env.SOURCE_DATE_EPOCH * 1000) : new Date().getTime())).getFullYear()} @plusauth/oidc-client-js Contributors
 * Released under the MIT License
 */`;
const plugins = (min) =>
  [
    commonjs(),
    nodeResolve({
      browser: true
    }),
    json(),
    swc({
      sourceMaps: true
    }),
    min && minify({
      sourceMap: true,
      compress: true
    })
  ];

export default [
  // UMD build
  {
    input: 'src/index.ts',
    plugins: plugins(true),
    output: {
      name: 'PlusAuthOIDCClient',
      file: browser,
      format: 'umd',
      indent: false,
      sourcemap: true,
    },
  },

  // ES6 builds
  // dist/chart.js
  // helpers/*.js
  {
    input: 'src/index.ts',
    plugins: plugins(),
    output: {
      file: module,
      banner,
      format: 'esm',
      indent: false,
      sourcemap: true,
    },
  },

  // Types
  // dist/types.d.ts
  // dist/helpers.d.ts
  {
    input: "src/index.ts",
    plugins: [dts()],
    output: {
      file: types,
      format: 'es'
    }
  }
];
