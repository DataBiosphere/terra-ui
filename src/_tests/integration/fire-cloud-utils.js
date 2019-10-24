const { findText, waitForNoSpinners, delay } = require('./integration-utils')


const fireCloud = () => {
  const openFireCloudSelector = async page => {
    return (await page.waitForXPath(`//*[@data-test-id="workspace-selector"]`)).click()
  }

  const selectWorkSpace = async (page, billingAccount, workSpace) => {
    await openFireCloudSelector(page)
    return (await page.waitForXPath(`//ul/li[contains(normalize-space(.),"${billingAccount}/${workSpace}")]`)).click()
  }

  const findFireCloudClickable = (page, text) => {
    return page.waitForXPath(`(//a | //*[@role="button"])[contains(normalize-space(.),"${text}") or contains(@data-test-id,"${text}")]`)
  }

  const click = async (page, text) => {
    return (await findFireCloudClickable(page, text)).click()
  }

  const signIntoFireCloud = async page => {
    await waitForNoSpinners(page)
    await findText(page, 'content you are looking for is currently only accessible')
    await delay(500) // wait half a second for full load not accounted for by spinners
    await page.evaluate(token => window.forceSignedIn(token), process.env.TERRA_TOKEN) // Note: function for Fire Cloud is forceSignedIn() while Terra is forceSignIn()
  }

  return { openFireCloudSelector, findFireCloudClickable, click, signIntoFireCloud, selectWorkSpace }
}
module.exports = {
  fireCloud: fireCloud()
}
