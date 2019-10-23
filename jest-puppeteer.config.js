module.exports = {
  launch: {
    headless: process.env.HEADLESS !== 'false',
    // Workaround for issue when accessing cross domain iframes in puppeteer while not headless:
    // https://github.com/GoogleChrome/puppeteer/issues/4960
    args: process.env.HEADLESS === 'true' ? [] : ['--disable-features=site-per-process']
  }
}
