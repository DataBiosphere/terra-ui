const { findText, waitForNoSpinners } = require('./integration-utils')


const fireCloud = () => {
  const openFireCloudSelector = async (page, workSpace) => {
    (await page.waitForXPath(`//*[@data-test-id="workspace-selector"]`)).click()
    return (await page.waitForXPath(`//ul/li[contains(normalize-space(.),"general-dev-billing-account/${workSpace}")]`)).click()
  }

  const findFireCloudClickable = (page, text) => {
    return page.waitForXPath(`(//a | //*[@role="button"])[contains(normalize-space(.),"${text}") or contains(@data-test-id,"${text}")]`)
  }

  const click = async (page, text) => {
    return (await findFireCloudClickable(page, text)).click()
  }

  const delay = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const signIntoFireCloud = async page => {
    await waitForNoSpinners(page)
    await findText(page, 'content you are looking for is currently only accessible')
    await delay(1000)
    await page.evaluate(token => window.forceSignedIn(token), process.env.TERRA_TOKEN) // Note: function for Fire Cloud is forceSignedIn while Terra is forceSignIn
  }

  return { openFireCloudSelector, findFireCloudClickable, click, signIntoFireCloud }
}
module.exports = {
  fireCloud: fireCloud()
}
