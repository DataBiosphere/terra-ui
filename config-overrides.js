const { execSync } = require('child_process')
const webpack = require('webpack')
const _ = require('lodash/fp')
const path = require('path')
const rewireReactHotLoader = require('react-app-rewire-hot-loader')
const { addBabelPlugin, useEslintRc } = require('customize-cra')
const manualOverrides = require('./webpack.config')

/* config-overrides.js */
module.exports = {
  webpack: function(config, env) {
    config = useEslintRc()(config)

    config = addBabelPlugin([
      'prismjs', {
        'languages': ['bash', 'python'],
        'plugins': ['line-numbers'],
        'theme': 'default',
        'css': true
      }
    ])(config)

    config = _.merge(config, manualOverrides)

    config.module.rules[2].oneOf.unshift(
      {
        include: [path.resolve(__dirname, 'src/icons')],
        loader: 'svg-react-loader'
      }
    )

    config.plugins.push(new webpack.DefinePlugin({
      SATURN_VERSION: JSON.stringify(execSync('git rev-parse HEAD').toString().trim()),
      SATURN_BUILD_TIMESTAMP: JSON.stringify(Date.now())
    }))
    return rewireReactHotLoader(config, env)
  },
  jest: function(config) {
    return _.merge(config, {
      moduleDirectories: ['node_modules', ''] // to allow Jest to resolve absolute module paths
    })
  }
}
