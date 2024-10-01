module.exports = {
  browserContext: 'incognito',
  launch: {
    devtools: process.env.DEVTOOLS === 'true',
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW === 'true' ? 250 : undefined,
    defaultViewport: { width: 1200, height: 800 },
    protocolTimeout: 720_000, // 12 minutes
    args: [],
  },
};
