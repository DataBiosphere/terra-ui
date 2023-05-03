import 'outdated-browser-rework/dist/style.css';

import outdatedBrowserRework from 'outdated-browser-rework';

outdatedBrowserRework({
  browserSupport: {
    Chrome: 67, // Includes Chrome for mobile devices
    Edge: 40,
    Safari: false,
    'Mobile Safari': 10,
    Opera: 54,
    Firefox: 60,
    Vivaldi: 1,
    IE: false,
  },
  isUnknownBrowserOK: true,
  messages: {
    en: {
      outOfDate: 'Terra may not function correctly in this browser.',
      update: {
        web: `If you experience issues, please try ${window.chrome ? 'updating' : 'using'} Google Chrome.`,
        googlePlay: 'Please install Chrome from Google Play',
        appStore: 'Please update iOS from the Settings App',
      },
      url: 'https://www.google.com/chrome/',
      callToAction: `${window.chrome ? 'Update' : 'Download'} Chrome now`,
      close: 'Close',
    },
  },
});
