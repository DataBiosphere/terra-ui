import expect from 'expect-puppeteer'
import { google } from 'googleapis'
import puppeteer from 'puppeteer'


expect.setDefaultOptions({ timeout: 5 * 1000 })

// const appUrlBase = 'https://bvdp-saturn-dev.appspot.com'
const appUrlBase = 'http://localhost:3000/#workspaces'
const user = {
    email: 'b.adm.firec@gmail.com',
    password: 'BroadDec1'
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


describe('Google', () => {
    let browser
    let page
    beforeEach(async () => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000
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
        // if debug, wait 1 second
        await wait(1000)
        console.log('🎉')
        await page.close()
        //TODO: cleanup browser so it doesn't stay open
        // return Promise.resolve();
    })



    it('create a workspace and launch an interactive analysis (notebook)', async () => {
        console.log('TEST STARTING')
        // console.log('Taking a break...');
        await realGoogleLogin(browser, page)


        // await page.waitForNavigation({waitUntil: 'load'});


        // console.log('Two second later');
        console.log('TEST CONTINUING')

        // await page.waitForNavigation({waitUntil: 'networkidle0'});
        await expect(page).toMatch('New Workspace')

        await page.hover('[testid="createNewWorkspace"]')
        await page.click('[testid="createNewWorkspace"]')

        // const dialog = await expect(page).toDisplayDialog(async () => {
        // 	await expect(page).toClick('[testid="createNewWorkspace"]')
        // })
        // this hangs ^


        const workspaceName = 'TestWS-1'
        await expect(page).toMatch('Workspace name *')
        // await page.type('[placeholder="Enter a name"]', workspaceName)
        await page.type('[testid="workspaceNameInput"]', workspaceName)

        //    await page.click('.Select-arrow-zone')
        //    await page.type('#react-select-2--value', 'general-dev-billing-account')
        // await page.keyboard.press('Enter')
        expect(page).toSelect('select[]')

        await page.type('[placeholder="Enter a description"]', 'description for ' + workspaceName)
        await wait(1 * 1000)
        // await page.hover('[style="outline: 0px; outline-offset: 0px; cursor: pointer; display: inline-flex; justify-content: space-around; align-items: center; height: 2.25rem; font-weight: 500; font-size: 14px; text-transform: uppercase; white-space: nowrap; user-select: none; border-radius: 5px; color: white; padding: 0px 1.5rem; background-color: rgb(38, 145, 208);"]')
        // await page.click('[style="outline: 0px; outline-offset: 0px; cursor: pointer; display: inline-flex; justify-content: space-around; align-items: center; height: 2.25rem; font-weight: 500; font-size: 14px; text-transform: uppercase; white-space: nowrap; user-select: none; border-radius: 5px; color: white; padding: 0px 1.5rem; background-color: rgb(38, 145, 208);"]')
        await page.hover('[testid="createWorkspaceButton"]')
        await page.click('[testid="createWorkspaceButton"]')

        // Error
        //   Error: Text not found "Workspace name *"
        //   waiting for function failed: timeout 500ms exceeded


        // return Promise.resolve();

        // TODO: login with a (saved) user

        //TODO: confirm workspace created successfully
        //TODO: * Create new notebook
        //TODO: * Open notebook (load cluster within a reasonable amount of time)
        //TODO: ((In notebook, execute a BQ call to public data)) -- can we do this?
        //TODO: * Close notebook
        //TODO: * Pause runtime
        //TODO: * Wait for successful completion of pause
        // TODO: cleanup the workspace



    }, 50 * 1000) //TODO: remove this timeout. - doesn't help with the page load.




})
