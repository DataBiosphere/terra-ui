const _ = require('lodash/fp');
const { JWT } = require('google-auth-library');
const { getSecrets, userEmail } = require('./integration-config');

// generates a JWT using the private key
const makeAuthClient = _.memoize((subject, { client_email: email, private_key: key }) => {
  return new JWT({
    email,
    scopes: ['profile', 'email', 'openid'],
    subject,
    key,
  });
});

const getToken = async (subject, key) => {
  const { token } = await makeAuthClient(subject, key).getAccessToken();
  return token;
};

const withUserToken = (testFn) => async (options) => {
  const { terraSaToken, terraSaKeyJson } = await getSecrets();
  if (terraSaToken != null) {
    return testFn({ ...options, terraSaToken });
  }
  const token = await getToken(userEmail, JSON.parse(terraSaKeyJson));
  return testFn({ ...options, token });
};

module.exports = {
  getToken,
  withUserToken,
};
