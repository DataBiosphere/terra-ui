const { click, findText, waitForNoSpinners } = require('./integration-utils')


const selectWorkspace = async (page, billingAccount, workspace) => {
  await click(page, `//*[@data-test-id="workspace-selector"]`)
  return click(page, `//ul/li[contains(normalize-space(.),"${billingAccount}/${workspace}")]`)
}

const signIntoFirecloud = async (page, token) => {
  /*
   * The FireCloud not-signed-in page renders the sign-in button while it is still doing some
   * initialization. If you log the status of the App components state for user-status and auth2
   * with each render, you see the following sequence:
   *   '#{}' ''
   *   '#{}' '[object Object]'
   *   '#{:refresh-token-saved}' '[object Object]'
   * If the page is used before this is complete (for example window.forceSignedIn adding
   * :signed-in to user-status), bad things happen (for example :signed-in being dropped from
   * user-status). Instead of reworking the sign-in logic for a case that (for the most part) only
   * a computer will operate fast enough to encounter, we'll just slow the computer down a little.
   */
  await page.waitForResponse(response => {
      console.log(response.url())
      return response.url().startsWith('https://accounts.google.com/o/oauth2/iframerpc')
        && response.request().method() === 'GET'
        && response.status() === 200
    }, { timeout: 30 * 1000 }
  )

  await page.waitForXPath('//title[text()="FireCloud | Broad Institute"]')
  await findText(page, 'content you are looking for is currently only accessible')
  await waitForNoSpinners(page)

  console.log(`Sign in Firecloud: ${page.url()}`)
  await page.waitForFunction('!!window["forceSignedIn"]')
  await page.evaluate(token => window.forceSignedIn(token), token) // Note: function for Fire Cloud is forceSignedIn() while Terra is forceSignIn()
}

module.exports = {
  selectWorkspace,
  signIntoFirecloud
}
