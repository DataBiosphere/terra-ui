import expect from 'expect-puppeteer'
import puppeteer from 'puppeteer'
import { getAccessToken, wait, generateUUID, setupTest, cleanupTest, createWorkspace } from 'src/_tests/test-utils'

expect.setDefaultOptions({ timeout: 5555 })

const DEBUG = false

describe('Google', () => {
  let browser
  let page
  let token
  const workspaceName = 'WorkflowTestWS-'+ generateUUID()
  const billingProjectName = 'general-dev-billing-account'

  beforeEach(async () => [browser, page, token] = await setupTest(browser, page))

  afterEach(async () => cleanupTest(browser, page, workspaceName, billingProjectName))


  it('create a workspace and launch a batch analysis (workflow)', async () => {
    await createWorkspace(page, workspaceName, billingProjectName)

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

    // add method config
    const workspaceUrl = page.url()
    console.log('here')

    await expect(page).toClick('[datatestid="navigationHamburgerIcon"]')
    await expect(page).toClick('[datatestid="Code & Tools-link"]')
    await expect(page).toClick('[datatestid="agoraLink"]')
    await page.waitForNavigation({ waitUntil: 'networkidle0' }) // could wrap the following into a promise block with `page.waitForNavigation()`
    // background signin for FireCloud
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
      const attributeTextboxDatatestid = 'echo_strings.echo_files.input'+i
      // await page.hover('[datatestid="' + attributeTextboxDatatestid + '"]')
      // await expect(page).toClick('[datatestid="' + attributeTextboxDatatestid + '"]')
      await expect(page).toFill('[datatestid="' + attributeTextboxDatatestid + '"]', '"string'+i+'"')
    }
    await page.screenshot({path: 'screenshots/'+workspaceName+'-0attributes.png'})

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
