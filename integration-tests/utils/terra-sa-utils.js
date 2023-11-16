const _ = require('lodash/fp');
const { JWT } = require('google-auth-library');
const { getSecrets, userEmail } = require('./integration-config');

// generates a JWT using json key, and a subject to be impersonated
const makeAuthClient = _.memoize((subject, { client_email: email, private_key: key }) => {
  return new JWT({
    email,
    scopes: ['profile', 'email', 'openid'],
    subject,
    key,
  });
});

// Gets a token for an (impersonated) user account using a service account key
const getToken = async (subject, key) => {
  const { token } = await makeAuthClient(subject, key).getAccessToken();
  return token;
};

const withUserToken = (testFn) => async (options) => {
  const { terraSaToken, terraSaKeyJson } = await getSecrets();
  if (terraSaToken != null) {
    console.log('using terraSaToken...');
    const token = terraSaToken;
    return testFn({ ...options, token });
  }
  const token = await getToken(userEmail, JSON.parse(terraSaKeyJson));
  console.log('using getToken token...');
  return testFn({ ...options, token });
};

module.exports = {
  getToken,
  withUserToken,
};
