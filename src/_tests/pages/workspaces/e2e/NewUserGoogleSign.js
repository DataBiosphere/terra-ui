// import faker from 'faker'
import puppeteer from 'puppeteer'


const appUrlBase = 'https://firecloud.dsde-staging.broadinstitute.org'
const routes = {
  public: {
    // register: `${appUrlBase}/register`,
    login: `${appUrlBase}`,
    workspaceList: `${appUrlBase}/#workspaces`
  },
  private: {
    workspace: `${appUrlBase}/#workspaces/broad-dsde-dev/aj-echo-test`,
    events: appUrlBase,
    alerts: `${appUrlBase}/alerts`,
    services: `${appUrlBase}/services`,
    team: `${appUrlBase}/team`
  },
  admin: {
    templates: `${appUrlBase}/templates`
  }
}

const user = {
  // email: faker.internet.email(),
  // firstName: faker.name.firstName(),
  // lastName: faker.name.lastName(),
  // mobile: faker.phone.phoneNumber(),
  // companyName: faker.company.companyName(),
  email: 'b.adm.firec@gmail.com',
  password: 'BroadDec1'
}


test('can sign in as a brand new user', async () => {
  const browser = await puppeteer.launch({
    // headless: false//, slowMo: 100 // slow down by X ms
  })
  const context = await browser.createIncognitoBrowserContext()
  const page = await context.newPage()
  await page.setViewport({
    width: 1920,
    height: 1080
  })
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))

  await page.goto(appUrlBase)//, {waitUntil: 'networkidle2'})

  await page.waitForSelector('#signInButton') //  seems to fail around here? debug mode?
  await page.click('#signInButton')
  const nav = new Promise(res => browser.on('targetcreated', res))

  await nav

  const pageList = await browser.pages()
  const newPage = await pageList[pageList.length - 1]


  await newPage.waitForSelector(`#identifierId`)
  await newPage.type(`#identifierId`, user.email)
  await newPage.click('#identifierNext')

  await newPage.waitForSelector('#password input[type="password"]', { visible: true })
  await newPage.type('#password input[type="password"]', user.password)

  await newPage.waitForSelector('#passwordNext', { visible: true })
  await page.waitFor(500)
  await newPage.click('#passwordNext')


  await page.goto(routes.private.workspace)
  // wait for element
  // click to open a workspace
  // wait for element
  // do stuff
}, 30000) // timeout after 30 seconds
