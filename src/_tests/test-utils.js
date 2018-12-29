export async function getAccessToken() {
  const { auth } = require('google-auth-library')
  console.log('key is: ' + process.env['FIRECLOUD_DEV_SA_KEY_JSON'])
  const keys = JSON.parse(process.env['FIRECLOUD_DEV_SA_KEY_JSON'])


  const client = auth.fromJSON(keys)
  client.scopes = ['profile', 'email', 'openid', 'https://www.googleapis.com/auth/devstorage.full_control', 'https://www.googleapis.com/auth/cloud-platform']
  client.subject = 'emma.redwalker@test.firecloud.org'
  const token = await client.authorize().then(auth => auth.access_token)
  console.log('token is: ' + token)
  return token
}
