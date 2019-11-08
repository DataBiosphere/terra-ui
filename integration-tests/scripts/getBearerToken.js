const { GoogleToken } = require('gtoken')


const getToken = async () => {
  try {
    const [sub, keyString] = process.argv.slice(2)
    const { client_email: email, private_key: key } = JSON.parse(keyString)

    const gtoken = new GoogleToken({
      email,
      scope: ['profile', 'email', 'openid'],
      sub,
      key
    })

    const { access_token: token } = await gtoken.getToken()
    console.log(token)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

getToken()
