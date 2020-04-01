const _ = require('lodash/fp')
const { JWT } = require('google-auth-library')
const fetch = require('node-fetch')
const { getSecrets, lyleUrl } = require('./integration-config')


const makeAuthClient = _.once(async () => {
  const { lyleKey } = await getSecrets()
  const { client_email: email, private_key: key } = JSON.parse(lyleKey)

  return new JWT({
    email,
    key,
    additionalClaims: { target_audience: lyleUrl }
  })
})

const fetchLyle = async (path, email) => {
  const url = `${lyleUrl}/api/${path}`
  const authClient = await makeAuthClient()

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authClient.getRequestHeaders(url)) },
    body: JSON.stringify({ email })
  })

  return res.json()
}

module.exports = {
  fetchLyle
}
