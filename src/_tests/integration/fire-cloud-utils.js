const { findText, waitForNoSpinners, delay } = require('./integration-utils')


const firecloud = () => {
  const openFirecloudSelector = async page => {
    return (await page.waitForXPath(`//*[@data-test-id="workspace-selector"]`)).click()
  }

  const selectWorkspace = async (page, billingAccount, workspace) => {
    await openFirecloudSelector(page)
    return (await page.waitForXPath(`//ul/li[contains(normalize-space(.),"${billingAccount}/${workspace}")]`)).click()
  }

  const findFirecloudClickable = (page, text) => {
    return page.waitForXPath(`(//a | //*[@role="button"])[contains(normalize-space(.),"${text}") or contains(@data-test-id,"${text}")]`)
  }

  const click = async (page, text) => {
    return (await findFirecloudClickable(page, text)).click()
  }

  const signIntoFirecloud = async page => {
    await waitForNoSpinners(page)
    await findText(page, 'content you are looking for is currently only accessible')
    await delay(500) // wait half a second for full load not accounted for by spinners
    await page.evaluate(token => window.forceSignedIn(token), process.env.TERRA_TOKEN) // Note: function for Fire Cloud is forceSignedIn() while Terra is forceSignIn()
  }

  return { openFirecloudSelector, findFirecloudClickable, click, signIntoFirecloud, selectWorkspace }
}
module.exports = {
  firecloud: firecloud()
}
