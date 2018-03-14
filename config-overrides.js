const mixinDeep = require('mixin-deep')
const rewireReactHotLoader = require('react-app-rewire-hot-loader')
const manualOverrides = require('./webpack.config')

/* config-overrides.js */
module.exports = {
  webpack: function override(config, env) {
    config = mixinDeep(config, manualOverrides)
    return rewireReactHotLoader(config, env)
  },
  jest: function(config) {
    return mixinDeep(config, {
      moduleDirectories: ['node_modules', '']
    })
  }
}
