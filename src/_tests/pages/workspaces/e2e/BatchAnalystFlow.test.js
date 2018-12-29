import expect from 'expect-puppeteer'
// import { google } from 'googleapis'
import puppeteer from 'puppeteer'
// import { mount } from 'enzyme'

import { getAccessToken } from 'src/_tests/test-utils'

// import { fetchOk } from 'src/libs/ajax'


expect.setDefaultOptions({ timeout: 5 * 1000 })

// const appUrlBase = 'https://bvdp-saturn-dev.appspot.com'
const appUrlBase = 'http://localhost:3000/#workspaces'

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function generateUUID() {
  let d = new Date().getTime()
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (d + Math.random()*16)%16 | 0
    d = Math.floor(d/16)
    return (c=='x' ? r : (r&0x3|0x8)).toString(16)
  })
  return uuid
}
describe('Google', () => {
  let browser
  let page
  beforeEach(async () => {
    puppeteer.DEFAULT_TIMEOUT_INTERVAL = 20000
    browser = await puppeteer.launch({
      headless: false//,
      // slowMo: 100 // slow down by X ms // this seems to make the test skip the things in beforeEach
    })
    const context = await browser.createIncognitoBrowserContext()
    page = await context.newPage()
    await page.setViewport({
      width: 1920,
      height: 1080
    })
    page.on('console', msg => console.log('PAGE LOG:', msg.text()))

    await Promise.all([
      page.goto(appUrlBase),
      wait(1000),
      page.waitForNavigation({ waitUntil: 'networkidle0' }) // this is so that it waits until the signin button appears ..  | maybe increase the timeout instead?
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


    // return page.waitForNavigation({waitUntil: 'networkidle0'});

    // console.log('Taking a break...');
    // await wait(1000);
    // console.log('Two second later');


    // await newPage.waitForSelector('#passwordNext', { visible: true });
    //    await newPage.waitFor(500)
    //    await newPage.hover('#passwordNext')
    // return newPage.click('#passwordNext')
    // await page.
  })

  afterEach(async () => {
    console.log('post-test 🎉')
    // if debug, wait 1 second
    await wait(2000)
    // clean up here?
    // clean up in beforeEach as well?
    await page.close()
    await browser.close()
    await browser.close()

    //TODO: cleanup browser so it doesn't stay open
    // return Promise.resolve();
  })


  it('create a workspace and launch a batch analysis (workflow)', async () => {
    console.log('TEST STARTING')
    // console.log('Taking a break...');
    // await realGoogleLogin(browser, page)


    // await page.waitForNavigation({waitUntil: 'load'});


    // console.log('Two second later');
    console.log('TEST CONTINUING')

    // await page.waitForNavigation({waitUntil: 'networkidle0'});
    await expect(page).toMatch('New Workspace')
    await wait(4000)

    await page.hover('[datatestid="createNewWorkspace"]')
    await page.click('[datatestid="createNewWorkspace"] div') // searches for a div descendant - the click does not launch the modal otherwise. TODO: investigate

    // const dialog = await expect(page).toDisplayDialog(async () => {
    // 	await expect(page).toClick('[datatestid="createNewWorkspace"]')
    // })
    // this hangs ^

    const workspaceName = 'TestWS-'+generateUUID()
    const billingProjectName = 'general-dev-billing-account'
    await expect(page).toMatch('Workspace name *')
    await wait(4000)
    // await page.type('[placeholder="Enter a name"]', workspaceName)
    await page.type('[datatestid="workspaceNameInput"]', workspaceName)

    // note: all modals go inside: id="modal-root"

    // use aria-labels ******** **
    // aria-label="billingProjectSelect"
    // could also use: `expect(instance).toSelect(selector, valueOrText[, options])`
    await page.click('[aria-label="billingProjectSelect"]')
    await page.type('[aria-label="billingProjectSelect"]', billingProjectName+'\n')

    await page.type('[placeholder="Enter a description"]', 'description for ' + workspaceName)
    await wait(2 * 1000)
    await expect(page).toClick('[datatestid="createWorkspaceButton"]')

    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await wait(2 * 1000) // try this and see if the workspace loading issue persists

    // confirm workspace created successfully
    await expect(page).toMatchElement('[datatestid="workspaceInfoSidePanel"]')

    // upload "small set" of data (& confirm)
    await expect(page).toClick('[datatestid="data-tab"]')
    await expect(page).toClick('[datatestid="uploadTsvButton"]')

    const input = await page.$('input[type="file"]')
    await input.uploadFile('./participant.tsv')
    await expect(page).toClick('[datatestid="uploadButton"]')
    await expect(page).toMatch('participant (1)')

    await expect(page).toClick('[datatestid="tools-tab"]')
    await expect(page).toMatch('No tools added')
    // await page.waitForNavigation({ waitUntil: 'networkidle0' })

    // TODO: * create a method config for a method in agora (set up the method)
    // add method config
    const workspaceUrl = page.url()
    console.log('here')

    await expect(page).toClick('[datatestid="navigationHamburgerIcon"]')
    await expect(page).toClick('[datatestid="Code & Tools-link"]')
    await expect(page).toClick('[datatestid="agoraLink"]')
    // TODO: (Create a method config for a method in Agora which is a single “word count” task which uses a real file (gs://) as input and writes results to a real file (gs://))
    // TODO: background signin again for FC
    await page.waitForNavigation({ waitUntil: 'networkidle0' }) // could wrap the following into a promise block with `page.waitForNavigation()`
    // background signin for FireCloud
    const token = await getAccessToken()
    console.log('token used here is : '+token)
    let executionContext = await page.mainFrame().executionContext()
    await executionContext.evaluate(
      token => {
        window.forceSignedIn(`${token}`)
      }, token
    )
    // await page.waitForNavigation({ waitUntil: 'networkidle0' })

    await expect(page).toClick('[data-test-id="Featured Methods-tab"]')
    await expect(page).toClick('[data-test-id="method-link-alex_methods-echo_strings"]')
    await expect(page).toClick('[data-test-id="export-to-workspace-button"]')
    await wait(2000) // can't go straight to the next one
    await expect(page).toClick('[data-test-id="use-blank-configuration-button"]')
    await wait(2000)

    // await expect(page).toSelect('select[data-test-id="destination-workspace"]', billingProjectName+'/'+workspaceName)

    await page.click('[data-test-id="workspace-selector"]')
    await page.type('[data-test-id="workspace-selector"]', workspaceName+'\n')
    await expect(page).toClick('[data-test-id="import-export-confirm-button"]')
    console.log('exported')
    await wait(2000)
    //await expect(page).toClick('[data-test-id="export-successful-modal-submit-button"]')
    //TODO: the above goes back to the saturn dev page. Should it use appUrlBase?
    // https://bvdp-saturn-dev.appspot.com/#workspaces/general-dev-billing-account/TestWS-76ef5cdc-1807-43f5-bfc4-d4ae29c51e2a/tools/alex_methods/echo_strings

    await Promise.all([
      page.goto(workspaceUrl),
      wait(1000),
      page.waitForNavigation({ waitUntil: 'networkidle0' }) // this is so that it waits until the signin button appears ..  | maybe increase the timeout instead?
    ])

    // background signin for Saturn
    // await page.waitForNavigation({ waitUntil: 'networkidle0' })
    executionContext = await page.mainFrame().executionContext()
    await executionContext.evaluate(
      token => {
        window.forceSignIn(`${token}`)
      }, token
    )

    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await expect(page).toClick('[datatestid="workflow-link-echo_strings"]') //add datatestid here
    // wait for nav again... todo: redo clicks if they involve navs to wait
    await wait(2000)

    // Configure inputs
    for (let i = 1; i <= 10; i++) {
      console.log('HERE1')
      console.log('HERE2')
      await expect(page).toFill('[datatestid="echo_strings.echo_files.input'+i+'"]', '"string'+i+'"')
    }
    // Configure outputs
    await expect(page).toClick('span', { text: 'Outputs' })
    await expect(page).toFill('[datatestid="echo_strings.echo_files.out"]', 'this.autooutput')

    await expect(page).toClick('[datatestid="saveWorkflowButton"]')
    // Launch a pipeline via config
    await expect(page).toClick('[datatestid="run-analysis-button"]')
    await expect(page).toClick('[datatestid="launch-analysis-subject_HCC1143_BL-link"]')
    await expect(page).toClick('[datatestid="launch-button"]')
    // probably needs to wait here

    // wait for successful completion (should we?)
    let keepRunning = true
    while (keepRunning) {
      await wait(5000)
      await expect(page).toClick('[datatestid="job history-tab"]') // to refresh analysis status
      try {
        // await expect(page).toMatch('[datatestid="runningIcon"]', { timeout: 5000 })
        await page.waitForSelector('[datatestid="runningIcon"]', { timeout: 5000 })
      } catch (error) {
        console.log('Analysis finished running')
        keepRunning = false
      }
    }
    await page.waitForSelector('[datatestid="successIcon"]', { timeout: 5000 })

    // "Check binding of results in entity model" (add output to entity model)
    await expect(page).toClick('[datatestid="data-tab"]')
    await expect(page).toClick('a', { text: 'participant (1)' })  ////// START HERE --- this doesn't do anything.
    await expect(page).toMatch('result: string1 string2 string3 string4 string5 string6 string7 string8 string9 string10')

    // TODO: cleanup the workspace (api?)
    //return Promise.resolve();
    await wait(5000)

    // failure screenshots
    // send result to bigquery
  }, 300 * 1000) //TODO: remove this timeout. - doesn't help with the page load.
})
