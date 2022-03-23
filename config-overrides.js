const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin')
const _ = require('lodash/fp')
const rewireReactHotLoader = require('react-app-rewire-hot-loader')
const { addBabelPlugin, addWebpackPlugin } = require('customize-cra')


module.exports = {
  webpack(config, env) {
    const newConfig = _.flow(
      addBabelPlugin([
        'prismjs', {
          languages: ['bash', 'python'],
          plugins: ['line-numbers'],
          theme: 'default',
          css: true
        }
      ]),
      addWebpackPlugin(new CspHtmlWebpackPlugin({
        // Per our security policy, 'script-src' cannot contain any of the options containing 'unsafe', e.g. 'unsafe-inline'
        'script-src': [
          '\'self\'',
          'https://fast.appcues.com', // secondary script loaded by appcues
          'https://us.jsagent.tcell.insight.rapid7.com', // secondary script loaded by tcell
          'https://cdnjs.cloudflare.com' // libraries loaded by notebook preview
        ],
        'style-src': ['*', '\'unsafe-inline\'']
      }, {
        // The local development environment uses dynamic scripts to push updates to the browser.
        // The restrictive CSP blocks that functionality, so we need to disable the plugin in dev mode.
        enabled: env === 'production',
        hashEnabled: { 'style-src': false },
        nonceEnabled: { 'style-src': false }
      })),
      _.update('ignoreWarnings', (old = []) => _.concat(old, /Failed to parse source map/))
    )(config)

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
