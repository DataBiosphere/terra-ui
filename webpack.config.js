const path = require('path')

// Note: this is split out into a separate file because IntelliJ parses it
module.exports = {
  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      __dirname
    ]
  }
}
