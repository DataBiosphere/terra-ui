const mixinDeep = require('mixin-deep')
const rewireReactHotLoader = require('react-app-rewire-hot-loader')
const manualOverrides = require('./webpack.config')

/* config-overrides.js */
module.exports = function override(config, env) {
  config = rewireReactHotLoader(config, env)
  return mixinDeep(config, manualOverrides)
}
