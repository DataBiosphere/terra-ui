const { click, findText, waitForNoSpinners, delay } = require('./integration-utils')


const selectWorkspace = async (page, billingAccount, workspace) => {
  await click(page, `//*[@data-test-id="workspace-selector"]`)
  return click(page, `//ul/li[contains(normalize-space(.),"${billingAccount}/${workspace}")]`)
}

const signIntoFirecloud = async (page, token) => {
  await waitForNoSpinners(page)
  await findText(page, 'content you are looking for is currently only accessible')
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
  await delay(2000) // wait two seconds for full load not accounted for by spinners; local and CircleCI seem okay with 1 second, but Bueller needs 2 seconds
  await page.evaluate(token => window.forceSignedIn(token), token) // Note: function for Fire Cloud is forceSignedIn() while Terra is forceSignIn()
}

module.exports = {
  selectWorkspace,
  signIntoFirecloud
}
