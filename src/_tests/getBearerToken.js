const { GoogleToken } = require('gtoken')


const getToken = async () => {
  try {
    const [sub, keyString] = process.argv.slice(2)
    const { client_email: email, private_key: key } = JSON.parse(keyString)

    const googleToken = new GoogleToken({
      email,
      scope: ['profile', 'email', 'openid'],
      sub,
      key
    })

    const tokenData = await googleToken.getToken()
    console.log(tokenData.access_token)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

getToken()
