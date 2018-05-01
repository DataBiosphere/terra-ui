const _ = require('lodash')
const rewireReactHotLoader = require('react-app-rewire-hot-loader')
const rewireEslint = require('react-app-rewire-eslint')
const manualOverrides = require('./webpack.config')

/* config-overrides.js */
module.exports = {
  webpack: function override(config, env) {
    config = rewireEslint(config, env)
    config = _.merge(config, manualOverrides)
    return rewireReactHotLoader(config, env)
  },
  jest: function(config) {
    return _.merge(config, {
      moduleDirectories: ['node_modules', ''] // to allow Jest to resolve absolute module paths
    })
  }
}
