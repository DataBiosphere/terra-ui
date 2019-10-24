module.exports = {
  launch: {
    devtools: (() => {
      if (process.env.DEVTOOLS === 'true') {
        process.env.IFRAMES === 'true' && console.warn('You cannot enable devtools while testing a UI with iframes in headful mode')
        return process.env.IFRAMES !== 'true'
      }
    })(),
    headless: process.env.HEADLESS !== 'false',
    // Workaround for issue when accessing cross domain iframes in puppeteer while not headless:
    // https://github.com/GoogleChrome/puppeteer/issues/4960
    args: process.env.HEADLESS === 'false' && process.env.IFRAMES === 'true' ? ['--disable-features=site-per-process'] : []
  }
}
