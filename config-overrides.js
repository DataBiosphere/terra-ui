const _ = require('lodash/fp')
const rewireReactHotLoader = require('react-app-rewire-hot-loader')
const { addBabelPlugin } = require('customize-cra')


module.exports = {
  webpack(config, env) {
    const newConfig = addBabelPlugin([
      'prismjs', {
        languages: ['bash', 'python'],
        plugins: ['line-numbers'],
        theme: 'default',
        css: true
      }
    ])(config)

    return rewireReactHotLoader(newConfig, env)
  },
  jest(config) {
    return _.merge(config, {
      transformIgnorePatterns: [
        'node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)'
      ],
      moduleDirectories: ['node_modules', 'src'] // to allow Jest to resolve absolute module paths
    })
  }
}
