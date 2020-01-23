const configOverrides = require('../config-overrides')


module.exports = {
  stories: ['../src/_stories/*.stories.js'],
  addons: [
    '@storybook/addon-actions',
    '@storybook/addon-knobs',
    '@storybook/addon-links',
    '@storybook/preset-create-react-app'
  ],
  webpackFinal: (config, { configType }) => configOverrides.webpack(config, configType)
}
