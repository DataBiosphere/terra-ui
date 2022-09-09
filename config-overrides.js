const fs = require('fs')
const path = require('path')

const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin')
const _ = require('lodash/fp')
const { addWebpackPlugin } = require('customize-cra')
const { paths } = require('react-app-rewired')
const { ESBuildMinifyPlugin } = require('esbuild-loader')


module.exports = {
  webpack(config, env) {
    const useTypeScript = fs.existsSync(paths.appTsConfig)

    return _.flow(
      // Replace babel-loader with esbuild-loader
      _.update(
        [
          'module',
          'rules',
          _.findIndex(rule => rule.oneOf, config.module.rules),
          'oneOf'
        ],
        rules => _.set(
          _.findLastIndex(
            rule => rule.loader && rule.loader.includes(`${path.sep}babel-loader${path.sep}`),
            rules
          ),
          {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            include: [paths.appSrc],
            loader: require.resolve('esbuild-loader'),
            options: {
              loader: useTypeScript ? 'ts' : 'js',
              target: 'es2015'
            }
          },
          rules
        )
      ),
      _.update(
        ['optimization', 'minimizer'],
        _.flow(
          // Remove OptimizeCssAssetsWebpackPlugin
          _.remove(minimizer => minimizer.constructor.name === 'OptimizeCssAssetsWebpackPlugin'),
          // Replace TerserPlugin with ESBuildMinifyPlugin
          _.map(minimizer => {
            if (minimizer.constructor.name === 'TerserPlugin') {
              return new ESBuildMinifyPlugin({
                target: 'es2015',
                css: true
              })
            }
            return minimizer
          })
        )
      ),
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
  },
  jest(config) {
    return _.set('transformIgnorePatterns', [], config)
  }
}
