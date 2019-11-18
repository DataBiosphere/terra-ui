const { bearerToken } = require('./integration-config')
const { click, findText, waitForNoSpinners, delay } = require('./integration-utils')


const selectWorkspace = async (page, billingAccount, workspace) => {
  await click(page, `//*[@data-test-id="workspace-selector"]`)
  return click(page, `//ul/li[contains(normalize-space(.),"${billingAccount}/${workspace}")]`)
}

const signIntoFirecloud = async page => {
  await waitForNoSpinners(page)
  await findText(page, 'content you are looking for is currently only accessible')
  await delay(500) // wait half a second for full load not accounted for by spinners
  await page.evaluate(token => window.forceSignedIn(token), bearerToken) // Note: function for Fire Cloud is forceSignedIn() while Terra is forceSignIn()
}

module.exports = {
  selectWorkspace,
  signIntoFirecloud
}
