const path = require('path');

module.exports = ({ config }) => {
  config.resolve.modules.push(path.resolve(__dirname, "../"));
  
  config.module.rules = config.module.rules.map( data => {
    if (/svg\|/.test( String( data.test ) ))
        data.test = /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani)(\?.*)?$/;

    return data;
  });

  config.module.rules.push({
      test: /\.svg$/,
      use: [ { loader: require.resolve('svg-react-loader') }]
  });

  return config;
};