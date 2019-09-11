module.exports = {
  // copied from https://github.com/smooth-code/jest-puppeteer/blob/master/.eslintrc.js
  env: {
    node: true,
    jest: true,
    browser: true
  },
  globals: {
    page: true,
    browser: true,
    context: true,
    jestPuppeteer: true
  }
}
