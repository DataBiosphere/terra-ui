const _ = require('lodash/fp');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const getSecret = async ({ project, secretName }) => {
  const client = new SecretManagerServiceClient();
  const name = `projects/${project}/secrets/${secretName}/versions/latest`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    return version.payload.data.toString('utf8');
  } catch (error) {
    console.error(`failed to fetch secret: ${secretName}`, error);
    return null;
  }
};

const {
  LYLE_URL: lyleUrl = 'https://terra-lyle.appspot.com',
  SCREENSHOT_DIR: screenshotDirPath,
  TERRA_USER_EMAIL: userEmail = 'Scarlett.Flowerpicker@test.firecloud.org',
} = process.env;

const project = process.env.GCP_PROJECT || 'terra-bueller';

// TODO: cleanup default getSecret behavior, enforce explicit import of secrets? or use an env var to explicity set
const getSecrets = _.once(async () => {
  return {
    lyleToken: process.env.LYLE_ACCESS_TOKEN,
    terraSaToken: process.env.TERRA_SA_ACCESS_TOKEN,
    lyleKey: process.env.LYLE_SA_KEY, // || (await getSecret({ project, secretName: 'lyle-sa-key' })),
    terraSaKeyJson: process.env.TERRA_SA_KEY || (await getSecret({ project, secretName: 'terra-sa-key' })),
  };
});

module.exports = {
  getSecrets,
  lyleUrl,
  screenshotDirPath,
  userEmail,
};
