const { JWT } = require('google-auth-library')
const fetch = require('node-fetch')
const { lyleKey, lyleUrl } = require('./integration-config')


const makeAuthClient = () => {
  const { client_email: email, private_key: key } = JSON.parse(lyleKey)

  return new JWT({
    email,
    key,
    additionalClaims: { target_audience: lyleUrl }
  })
}

const authClient = makeAuthClient()

const fetchLyle = async (path, email) => {
  const url = `${lyleUrl}/api/${path}`

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
