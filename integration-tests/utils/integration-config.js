const _ = require('lodash/fp');

const {
  LYLE_URL: lyleUrl = 'https://terra-lyle.appspot.com',
  SCREENSHOT_DIR: screenshotDirPath,
  TERRA_USER_EMAIL: userEmail = 'Scarlett.Flowerpicker@test.firecloud.org',
} = process.env;

// TODO: cleanup default getSecret behavior, enforce explicit import of secrets? or use an env var to explicity set
const getSecrets = _.once(async () => {
  return {
    lyleToken: process.env.LYLE_ACCESS_TOKEN,
    terraSaToken: process.env.TERRA_SA_ACCESS_TOKEN,
    lyleKey: process.env.LYLE_SA_KEY, // || (await getSecret({ project, secretName: 'lyle-sa-key' })),
    terraSaKeyJson: process.env.TERRA_SA_KEY, // || (await getSecret({ project, secretName: 'terra-sa-key' })),
  };
});

module.exports = {
  getSecrets,
  lyleUrl,
  screenshotDirPath,
  userEmail,
};
