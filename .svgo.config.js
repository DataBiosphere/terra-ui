const { extendDefaultPlugins } = require('svgo')
// svgo --enable=inlineStyles,prefixIds  --config '{ "plugins": [ { "inlineStyles": { "onlyMatchedOnce": false } }] }' --pretty -f src/images -r -p 1 --multipass

module.exports = {
  multipass: true,
  js2svg: {
    pretty: true
  },
  plugins: extendDefaultPlugins([
    {
      name: 'inlineStyles',
      params: {
        onlyMatchedOnce: false
      }
    }, {
      name: 'cleanupIDs',
      params: {
        minify: false // can't be used at the same time as prefixIds, https://github.com/svg/svgo/issues/1406
      }
    }, {
      name: 'prefixIds',
      active: true
    }, {
      name: 'cleanupNumericValues',
      params: {
        floatPrecision: 1
      }
    }
  ])
}
