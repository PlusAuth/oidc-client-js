import { Config } from 'bili'

const config: Config = {
  banner: false,
  extendConfig(config, { format, input }){
    config.output.minify = format === 'umd';
    return config
  },
  input: {
    'plusauth-oidc-client': 'src/index.ts'
  },
  bundleNodeModules: true,
  babel: {
    minimal: true
  },
  output: {
    minify: true,
    target: "browser",
    format: [ 'es', 'umd'],
    moduleName: 'PlusAuthOIDCClient',
    sourceMap: true,
  },
  plugins: {
    typescript2: {
      clean: true,
      tsconfig: 'tsconfig.json',
      useTsconfigDeclarationDir: true
    }
  }
}

export default config
