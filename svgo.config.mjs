export default {
  multipass: true,
  js2svg: {
    indent: 2, // number
    pretty: true, // boolean
  },
  floatPrecision: 1,
  plugins: [
    'preset-default', // built-in plugins enabled by default
    'prefixIds', // enable built-in plugins by name
    {
      name: 'preset-default',
      params: {
        overrides: {
          // disable a default plugin
          cleanupIds: false,

          // customize the params of a default plugin
          inlineStyles: {
            onlyMatchedOnce: false
          }
        }
      }
    }
    // enable built-in plugins with an object to configure plugins
    // {
    //   name: 'prefixIds',
    //   params: {
    //     prefix: 'uwu',
    //   },
    // },
  ]
}
