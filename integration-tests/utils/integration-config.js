const _ = require('lodash/fp');

const {
  LYLE_URL: lyleUrl = 'https://terra-lyle.appspot.com',
  SCREENSHOT_DIR: screenshotDirPath,
  TERRA_USER_EMAIL: userEmail = 'Scarlett.Flowerpicker@test.firecloud.org',
} = process.env;

const getSecrets = _.once(async () => {
  const lyleToken = process.env.LYLE_ID_TOKEN;
  const userAccessToken = process.env.USER_ACCESS_TOKEN;

  // If no token was given, use a service account to generate one.
  const lyleKey = lyleToken ? null : process.env.LYLE_SA_KEY;
  const terraSaKeyJson = userAccessToken ? null : process.env.TERRA_SA_KEY;

  return {
    lyleToken,
    userAccessToken,
    lyleKey,
    terraSaKeyJson,
  };
});

module.exports = {
  getSecrets,
  lyleUrl,
  screenshotDirPath,
  userEmail,
};
