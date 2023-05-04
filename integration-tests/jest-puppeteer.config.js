/* eslint-disable prefer-template */
const printWarning = (message) => {
  if (process.env.warningPrinted) {
    return;
  }
  console.warn('\n\x1b[1m' /* bold */ + '╔'.padEnd(80, '═') + '╗');
  message.forEach((line) => {
    console.warn(`║ ${line}`.padEnd(80) + '║');
  });
  console.warn('╚'.padEnd(80, '═') + '╝');
  console.warn('\x1b[0m' /* not-bold */);
  process.env.warningPrinted = true;
};

module.exports = {
  browserContext: 'incognito',
  launch: {
    devtools: process.env.DEVTOOLS === 'true',
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW === 'true' ? 250 : undefined,
    defaultViewport: { width: 1200, height: 800 },
    // Workaround for issue when accessing cross domain iframes in puppeteer while not headless:
    // https://github.com/GoogleChrome/puppeteer/issues/4960
    args: (({ headfull, devtools }) => {
      const flag = '--disable-features=site-per-process';

      if (headfull && devtools) {
        printWarning([
          'iframes Issue'.padStart(40),
          'Dev tools cannot be opened in headless mode with the',
          `${flag} flag set. If you are running tests`,
          'with iframes they will fail with dev tools turned on.',
        ]);
        return [];
      }
      if (headfull) {
        printWarning([
          'Chromium flag set'.padStart(40),
          `Headfull mode also sets the ${flag} flag`,
          'This allows iframe tests to work in Headfull mode.',
          'If you notice unexpected side effects in your tests',
          'you can disable this flag in src/jest-puppeteer.config.js',
        ]);
        return [flag];
      }
      return [];
    })({ headfull: process.env.HEADLESS === 'false', devtools: process.env.DEVTOOLS === 'true' }),
  },
};
