const _ = require('lodash/fp')
const { google } = require('googleapis')
const puppeteer = require('puppeteer')


class Response {
  constructor(status, data) {
    this.status = status
    this.data = data
  }
}

const promiseHandler = fn => (req, res) => {
  const handleValue = value => {
    if (value instanceof Response) {
      res.status(value.status).send(value.data)
    } else {
      console.error(value)
      res.status(500).send(value.toString())
    }
  }
  return fn(req, res).then(handleValue, handleValue)
}

const validateInput = (value, schema) => {
  const { error } = schema.validate(value)
  if (error) {
    throw new Response(400, error.message)
  }
}

const getAuthClient = _.once(() => {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  })
  return auth.getClient()
})

const withAuth = wrappedFn => async (req, ...args) => {
  const idToken = (req.headers.authorization || '').split(' ')[1]
  const authClient = await getAuthClient()
  const ticket = await authClient.verifyIdToken({ idToken, audience: 'https://terra-bueller.appspot.com' })
  const { email } = ticket.getPayload()
  if (email !== 'bueller-user@terra-bueller.iam.gserviceaccount.com') {
    throw new Response(403)
  }
  return wrappedFn(req, ...args)
}

const getBrowser = _.once(() => puppeteer.launch({ headless: true, defaultViewport: { width: 1200, height: 800 } }))

const withPuppeteer = fn => async options => {
  const browser = await getBrowser()
  const context = await browser.createIncognitoBrowserContext()
  const page = await context.newPage()
  try {
    return await fn({ browser, context, page, ...options })
  } finally {
    await context.close() // TODO: return something?
  }
}

module.exports = {
  Response,
  promiseHandler,
  validateInput,
  withAuth,
  withPuppeteer
}
