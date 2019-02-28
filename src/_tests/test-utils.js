import expect from 'expect-puppeteer'
import puppeteer from 'puppeteer'

const appUrlBase = 'http://localhost:3000/#workspaces'
const rawlsUrl = 'https://rawls.dsde-dev.broadinstitute.org'
//TODO: read this in from CircleCI

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


export async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function generateUUID() {
  let d = new Date().getTime()
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (d + Math.random()*16)%16 | 0
    d = Math.floor(d/16)
    return (c=='x' ? r : (r&0x3|0x8)).toString(16)
  })
  return uuid
}

export const setupTest = async (browser, page) => {
  puppeteer.DEFAULT_TIMEOUT_INTERVAL = 20001
  jest.setTimeout(20002)
  browser = await puppeteer.launch({
    args: ['--disable-features=site-per-process'], // this is needed to use waitForSelector within iframes
    headless: false//,
    // slowMo: 100 // try below option..
  })
  // TODO: add debug mode
  // if (DEBUG) {
  //   puppeteer.slowMo = 100 // slow down by X ms
  // }
  const context = await browser.createIncognitoBrowserContext()
  page = await context.newPage()
  await page.setViewport({
    width: 1920,
    height: 1200
  })
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))

  await Promise.all([
    page.goto(appUrlBase, { waitUntil: 'networkidle0' })//,
  ])

  const token = await getAccessToken()
  console.log('token is: ' + token)

  // background signin
  const executionContext = await page.mainFrame().executionContext()
  await executionContext.evaluate(
    token => {
      window.forceSignIn(`${token}`)
    }, token
  )
  await page.waitForNavigation({ waitUntil: 'networkidle0' })

  // accept TOS on new environments
  try {
    await page.waitForSelector('[datatestid="acceptTosButton"]', { timeout: 2000 })
    await expect(page).toClick('[datatestid="acceptTosButton"]')
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
  } catch (error) {
    console.log('Did not see the TOS page.. Continuing on.')
  }

  return [browser, page, token]
}

export const cleanupTest = async (browser, page, token, workspaceName, billingProjectName) => {
  console.log('post-test 🎉')
  // TODO: if test failed, change the name of the screenshot
  const screenshotPath = 'screenshots/endoftest-batch-'+workspaceName+'-.png'
  console.log('screenshot saved at: ' + screenshotPath)
  await page.screenshot({ path: screenshotPath })
  // if debug, wait 1 second
  await wait(2000)
  // clean up workspace via api call
  await fetch(rawlsUrl + '/api/workspaces/' + billingProjectName + '/' + workspaceName,
    { 'headers': { 'authorization': 'Bearer ' + token, 'x-app-id': 'Saturn' }, 'body': null, 'method': 'DELETE', 'mode': 'cors' })
  // clean up in beforeEach as well?
  console.log('cleanup 🎉🎉🎉')
  await page.close()
  await browser.close()
}

export const createWorkspace = async (page, workspaceName, billingProjectName) => {
  // verify that we're on the workspaces page
  await expect(page).toMatch('New Workspace')
  await wait(4000)

  await page.hover('[datatestid="createNewWorkspace"]')
  await page.click('[datatestid="createNewWorkspace"] div') // searches for a div descendant - the click does not launch the modal otherwise. TODO: investigate

  // create a new function to handle this?
  // note: all modals go inside: id="modal-root"
  await expect(page).toMatch('Workspace name *')
  await wait(4000)
  await page.type('[datatestid="workspaceNameInput"]', workspaceName)
  await page.click('[aria-label="billingProjectSelect"]')
  await page.type('[aria-label="billingProjectSelect"]', billingProjectName+'\n')

  await page.type('[placeholder="Enter a description"]', 'description for ' + workspaceName)
  await wait(2 * 1000)
  await expect(page).toClick('[datatestid="createWorkspaceButton"]')

  await page.waitForNavigation({ waitUntil: 'networkidle0' })
  await wait(2 * 1000) // try this and see if the workspace loading issue persists

  // confirm workspace created successfully
  await expect(page).toMatchElement('[datatestid="workspaceInfoSidePanel"]')
}

// waitForNetworkIdle is useful when you expect a network request without a page navigation
export async function waitForNetworkIdle(page, timeout, maxInflightRequests = 0) {
  page.on('request', onRequestStarted)
  page.on('requestfinished', onRequestFinished)
  page.on('requestfailed', onRequestFinished)

  let inflight = 0
  let fulfill
  const promise = new Promise(x => fulfill = x)
  let timeoutId = setTimeout(onTimeoutDone, timeout)
  return promise

  function onTimeoutDone() {
    page.removeListener('request', onRequestStarted)
    page.removeListener('requestfinished', onRequestFinished)
    page.removeListener('requestfailed', onRequestFinished)
    fulfill()
  }

  function onRequestStarted() {
    ++inflight
    if (inflight > maxInflightRequests) clearTimeout(timeoutId)
  }

  function onRequestFinished() {
    if (inflight === 0) return
    --inflight
    if (inflight === maxInflightRequests) timeoutId = setTimeout(onTimeoutDone, timeout)
  }
}
