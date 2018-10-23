const { execSync } = require('child_process')
const webpack = require('webpack')
const _ = require('lodash')
const path = require('path')
const rewireReactHotLoader = require('react-app-rewire-hot-loader')
const rewireEslint = require('react-app-rewire-eslint')
const manualOverrides = require('./webpack.config')

/* config-overrides.js */
module.exports = {
  webpack: function override(config, env) {
    config = rewireEslint(config, env)
    config.resolve.modules = manualOverrides.resolve.modules
    config.module.rules[2].oneOf.unshift(
      {
        include: [path.resolve(__dirname, 'src/icons')],
        loader: 'raw-loader'
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
