// node scripts/makeBearerToken.js "$(vault read --format=json secret/dsde/terra/envs/common/bueller-user-service-account-key |jq .data)" https://terra-bueller.appspot.com
const { JWT } = require('google-auth-library')


const keyJson = process.argv[2]
const audience = process.argv[3]
const { client_email: email, private_key: key } = JSON.parse(keyJson)
const jwt = new JWT({ email, key, additionalClaims: { target_audience: audience } })

const getToken = async () => {
  const { Authorization: authHeader } = await jwt.getRequestHeaders(audience)
  const token = authHeader.replace('Bearer ', '')
  console.info(token)
}
getToken().catch(console.error)
