const { execSync } = require('child_process')
const webpack = require('webpack')
const _ = require('lodash/fp')
const path = require('path')
const rewireReactHotLoader = require('react-app-rewire-hot-loader')
const { addBabelPlugin, addWebpackModuleRule, addWebpackPlugin, useEslintRc } = require('customize-cra')


module.exports = {
  webpack(config, env) {
    const newConfig = _.flow(
      useEslintRc(),
      addBabelPlugin([
        'prismjs', {
          languages: ['bash', 'python'],
          plugins: ['line-numbers'],
          theme: 'default',
          css: true
        }
      ]),
      addWebpackModuleRule({
        include: [path.resolve(__dirname, 'src/icons')],
        loader: 'svg-react-loader'
      }),
      addWebpackPlugin(new webpack.DefinePlugin({
        SATURN_VERSION: JSON.stringify(execSync('git rev-parse HEAD').toString().trim()),
        SATURN_BUILD_TIMESTAMP: JSON.stringify(Date.now())
      }))
    )(config)

    return rewireReactHotLoader(newConfig, env)
  },
  jest(config) {
    return _.merge(config, {
      moduleDirectories: ['node_modules', ''] // to allow Jest to resolve absolute module paths
    })
  }
}
