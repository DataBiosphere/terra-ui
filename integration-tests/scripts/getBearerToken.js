const { JWT } = require('google-auth-library')


const getToken = async () => {
  try {
    const [subject, keyString] = process.argv.slice(2)
    const { client_email: email, private_key: key } = JSON.parse(keyString)

    const authClient = new JWT({
      email,
      scopes: ['profile', 'email', 'openid'],
      subject,
      key
    })

    const { token } = await authClient.getAccessToken()
    console.log(token)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

getToken()
