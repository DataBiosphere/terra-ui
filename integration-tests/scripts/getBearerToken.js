const { getToken } = require('../utils/terra-sa-utils')


const main = async () => {
  const [subject, keyJson] = process.argv.slice(2)
  const key = JSON.parse(keyJson)
  try {
    const token = await getToken(subject, key)
    console.log(token)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
