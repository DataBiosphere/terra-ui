import expect from 'expect-puppeteer'
import puppeteer from 'puppeteer'
import { getAccessToken, wait, generateUUID, setupTest, cleanupTest, createWorkspace } from 'src/_tests/test-utils'

expect.setDefaultOptions({ timeout: 5555 })

const DEBUG = false

describe('Google', () => {
  let browser
  let page
  let token
  const workspaceName = 'NotebookTestWS-'+ generateUUID()
  const billingProjectName = 'general-dev-billing-account'

  beforeEach(async () => [browser, page, token] = await setupTest(browser, page))

  afterEach(async () => cleanupTest(browser, page, token, workspaceName, billingProjectName))


  it('create a workspace and launch an interactive analysis (notebook)', async () => {
    await createWorkspace(page, workspaceName, billingProjectName)

    // Create new notebook
    await expect(page).toClick('[datatestid="notebooks-tab"]')
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await page.screenshot({ path: 'screenshots/'+workspaceName+'-0notebook.png' })
    await page.waitForSelector('[datatestid="uploadNotebook"]', { timeout: 10000 })
    const input = await page.$('input[type="file"]')
    await input.uploadFile('./cluster_analysis.ipynb')
    // Open notebook (load cluster within a reasonable amount of time)
    await expect(page).toClick('[datatestid="cluster_analysis-notebook-link"]')

    let keepRunning = true
    while (keepRunning) {
      try {
        await page.waitForSelector('[datatestid="loadingSpinner"]', { timeout: 4901 })
      } catch (error) {
        console.log('Notebook Loading screen - Notebook runtime finished')
        keepRunning = false
        await wait(4949)
      }
    }
    await page.screenshot({ path: 'screenshots/'+workspaceName+'-0b-nomospinner.png' })

    // keepRunning = true
    // while (keepRunning) {
    try {
      await page.waitForSelector('[datatestid="icon-check"]', { timeout: 4902 })
    } catch (error) {
      console.log('Notebook Loading screen - Notebook runtime finished')
      keepRunning = false
      await wait(4949)
    }
    // }
    await page.screenshot({ path: 'screenshots/'+workspaceName+'-0c-check.png' })


    await page.screenshot({ path: 'screenshots/'+workspaceName+'-1checkiframe-loaded.png' })

    //Close notebook. This is in an iframe so we need to find the iframe first and search within it.
    const frame = await page.frames().find(f => f.name() === 'iframeID')
    await page.screenshot({ path: 'screenshots/'+workspaceName+'-1iframe-loaded.png' })

    // is frame loaded?
    await frame.waitForSelector('#notebook-container')


    const button = await frame.waitForSelector('#menubar-close-button')
    await button.click()

    await page.waitForNavigation({ waitUntil: 'networkidle0' }) // doesn't seem to click on the pause icon here...
    //Pause runtime
    await page.screenshot({ path: 'screenshots/'+workspaceName+'-2a-checkforupdatednotebookmessage.png' })

    try {
      await page.waitForSelector('[datatestid="icon-times"]', { timeout: 4903 })
      await expect(page).toClick('[datatestid="icon-times"]')
      console.log('Closed "Recently updated notebook" popup')
    } catch (error) {
      console.log('No "times" icon for Recently updated notebook')
    }
    await page.screenshot({ path: 'screenshots/'+workspaceName+'-2a2-closedupdatednotebookmessage.png' })


    console.log('Pausing cluster')

    await page.screenshot({ path: 'screenshots/'+workspaceName+'-2pause-notebook.png' })
    await expect(page).toClick('[datatestid="cluster-pause-icon"]', { timeout: 4904 })
    //Wait for successful completion of pause
    // while it's stopping, it will show the 'cluster-sync-icon'
    // then once it's done it will show the 'cluster-play-icon'
    await page.screenshot({ path: 'screenshots/'+workspaceName+'-2pt2.png' })

    await page.waitForSelector('[datatestid="cluster-sync-icon"]', { timeout: 10000 })
    await page.screenshot({ path: 'screenshots/'+workspaceName+'-3pausing-notebook.png' })

    keepRunning = true
    while (keepRunning) {
      await wait(4949)
      try {
        await page.waitForSelector('[datatestid="cluster-sync-icon"]', { timeout: 4905 })
        console.log('Pausing in progress.. waiting 5 seconds.')
      } catch (error) {
        console.log('Cluster loading icon is gone!')
        keepRunning = false
      }
    }
    await page.screenshot({ path: 'screenshots/'+workspaceName+'-4paused-notebook.png' })
    await page.waitForSelector('[datatestid="cluster-play-icon"]', { timeout: 10000 })
    console.log('Cluster pause completed!')
    return Promise.resolve()
  }, 600 * 1000) // this is the max timeout for any individual step (?)
})
