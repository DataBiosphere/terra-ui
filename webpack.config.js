const path = require('path')

// Note: this is split out into a separate file because IntelliJ parses it
module.exports = {
  resolve: {
    modules: [
      'node_modules',
      path.resolve(__dirname)
    ]
  }
}
