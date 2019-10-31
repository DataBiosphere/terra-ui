const path = require('path')
const { useEslintRc } = require('customize-cra')


module.exports = ({ config }) => {
  // Needed for .stories/config.js
  config.resolve.modules.push(path.resolve(__dirname, '../'))
  config.module.rules = config.module.rules.map(data => {
    data.test = /svg\|/.test(String(data.test)) ? /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani)(\?.*)?$/ : data.test
    return data
  })

  // Replace storybook's default svg loader	
  config.module.rules.push({
    test: /\.svg$/,
    use: [{ loader: require.resolve('svg-react-loader') }]
  })

  return useEslintRc()(config)
}
