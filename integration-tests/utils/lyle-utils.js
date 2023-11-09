const _ = require('lodash/fp');
const { JWT } = require('google-auth-library');
const fetch = require('node-fetch');
const { getSecrets, lyleUrl } = require('./integration-config');

// Generates a JWT using a lyle SA Key
const makeAuthClient = _.once(async () => {
  const { lyleKey } = await getSecrets();
  const { client_email: email, private_key: key } = JSON.parse(lyleKey);

  return new JWT({
    email,
    key,
    additionalClaims: { target_audience: lyleUrl },
  });
});

// HTTP client for the lyle service; manages lyle url and header boilerplate
const fetchLyle = async (path, email) => {
  const url = `${lyleUrl}/api/${path}`;
  const { lyleToken } = await getSecrets();
  // only try to get the JWT if no token exists
  const authClient = lyleToken == null ? await makeAuthClient() : null;

  // there's some formatting differences between the getRequestHeaders and the token as provided by GHA auth.
  // getRequestHeaders uses the lyle JWT to grab an access token
  const bearerToken = lyleToken == null ? await authClient.getRequestHeaders(url) : { Authorization: `Bearer ${lyleToken.replaceAll('"', '')}` };

  // TODO: remove, these are shortlived tokens so should be fine though.
  console.log(`bearerToken: ${JSON.stringify(bearerToken)}`);
  console.log(`lyleToken: ${JSON.stringify(lyleToken)}`);
  // const bearerToken = (await authClient.getRequestHeaders(url));

  try {
    const res = await fetch(url, {
      method: 'POST',
      // headers: { 'Content-Type': 'application/json', ...(await authClient.getRequestHeaders(url)) }, //this line uses the lyle privkey to generate an acces token to pass to the lyle service
      headers: { 'Content-Type': 'application/json', ...bearerToken },
      body: JSON.stringify({ email }),
    });

    console.log(`fetchLyle: POST ${res.status} ${url}`);
    if (res.ok) {
      return res.json();
    }
    // delegate non-2xx response to enclosing try/catch
    throw _.set('response', res, new Error());
  } catch (err) {
    console.error(err);
    const errorBody = await err.response.text();
    console.error(`fetchLyle response: ${errorBody}`);
    throw err;
  }
};

module.exports = {
  fetchLyle,
};
