const fetch = require('node-fetch')
const { lyleToken, lyleUrl } = require('./integration-config')
const { GoogleToken } = require('gtoken')

const getLyleToken = async () => {
  const { client_email: email, private_key: key } = JSON.parse(lyleToken)

  const gtoken = new GoogleToken({
    email,
    key,
    additionalClaims: { target_audience: 'https://terra-lyle.appspot.com' }
  })

  const { id_token: token } = await gtoken.getToken()

  return token
}

const fetchLyle = async (path, email) => {
  const res = await fetch(`${lyleUrl}/api/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getLyleToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({email})
  })

  return res.json()
}

module.exports = {
  fetchLyle
}
