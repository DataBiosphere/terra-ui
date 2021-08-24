const _ = require('lodash/fp')
const rewireReactHotLoader = require('react-app-rewire-hot-loader')
const { addBabelPlugin } = require('customize-cra')


module.exports = {
  webpack(config, env) {
    const newConfig = addBabelPlugin([
      'prismjs', {
        languages: ['bash', 'python', 'javascript'],
        plugins: ['line-numbers'],
        theme: 'default',
        css: true
      }
    ])(config)

    return rewireReactHotLoader(newConfig, env)
  },
  jest(config) {
    return _.merge(config, {
      moduleDirectories: ['node_modules', ''] // to allow Jest to resolve absolute module paths
    })
  }
}
