const _ = require('lodash/fp')
const { Storage } = require('@google-cloud/storage')
const { screenshotBucket, screenshotDirPath } = require('../utils/integration-config')


const waitForFn = async ({ fn, interval = 2000, timeout = 10000 }) => {
  const readyState = new Promise(resolve => {
    const start = Date.now()
    const intervalId = setInterval(() => {
      const success = fn()
      success && resolve({ success, intervalId })
      Date.now() - start > timeout && resolve({ intervalId })
    }, interval)
  })

  const { success, intervalId } = await readyState
  clearInterval(intervalId)
  return success
}

const findIframe = async page => {
  const iframeNode = await page.waitForXPath('//*[@role="main"]/iframe')
  const srcHandle = await iframeNode.getProperty('src')
  const src = await srcHandle.jsonValue()
  const hasFrame = () => page.frames().find(frame => frame.url().includes(src))

  return hasFrame() || await waitForFn({ fn: hasFrame })
}

const findInGrid = (page, textContains, options) => {
  return page.waitForXPath(`//*[@role="table"][contains(normalize-space(.),"${textContains}")]`, options)
}

const clickable = ({ text, textContains }) => {
  const base = '(//a | //button | //*[@role="button"] | //*[@role="link"])'
  if (text) {
    return `${base}[normalize-space(.)="${text}" or @title="${text}" or @aria-label="${text}" or @aria-labelledby=//*[normalize-space(.)="${text}"]/@id]`
  } else if (textContains) {
    return `${base}[contains(normalize-space(.),"${textContains}") or contains(@title,"${textContains}") or contains(@aria-label,"${textContains}") or @aria-labelledby=//*[contains(normalize-space(.),"${textContains}")]/@id]`
  }
}

const click = async (page, xpath, options) => {
  return (await page.waitForXPath(xpath, options)).click()
}

const findText = (page, textContains, options) => {
  return page.waitForXPath(`//*[contains(normalize-space(.),"${textContains}")]`, options)
}

const input = ({ labelContains, placeholder }) => {
  const base = '(//input | //textarea)'
  if (labelContains) {
    return `${base}[contains(@aria-label,"${labelContains}") or @id=//label[contains(normalize-space(.),"${labelContains}")]/@for or @aria-labelledby=//*[contains(normalize-space(.),"${labelContains}")]/@id]`
  } else if (placeholder) {
    return `${base}[@placeholder="${placeholder}"]`
  }
}

const fillIn = async (page, xpath, text) => {
  const input = await page.waitForXPath(xpath)
  await input.type(text, { delay: 20 })
  // There are several places (e.g. workspace list search) where the page responds dynamically to
  // typed input. That behavior could involve extra renders as component state settles. We strive to
  // avoid the kinds of complex, multi-stage state transitions that can result in extra renders.
  // But we aren't perfect.
  //
  // The impact on these tests is that elements found in the DOM immediately after typing text might
  // get re-rendered (effectively going away) before the test can interact with them, leading to
  // frustrating intermittent test failures. This test suite is _not_ intended to guard against
  // unnecessary renders. It is to check that some specific critical paths through the application
  // (Critical User Journeys) are not broken. Therefore, we'll delay briefly here instead of
  // charging forward at a super-human pace.
  return delay(300) // withDebouncedChange in input.js specifies 250ms, so waiting longer than that
}

// Replace pre-existing value
const fillInReplace = async (page, xpath, text) => {
  await (await findElement(page, xpath)).click({ clickCount: 3 }) // triple-click to replace the default text
  return await fillIn(page, xpath, text)
}

const select = async (page, labelContains, text) => {
  await click(page, input({ labelContains }))
  return click(page, `//div[starts-with(@id, "react-select-") and contains(normalize-space(.),"${text}")]`)
}

const waitForNoSpinners = page => {
  return page.waitForXPath('//*[@data-icon="loadingSpinner"]', { hidden: true })
}

const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const dismissNotifications = async page => {
  await delay(3000) // delayed for any alerts to show
  const notificationCloseButtons = await page.$x('(//a | //*[@role="button"] | //button)[contains(@aria-label,"Dismiss") and not(contains(@aria-label,"error"))]')

  await Promise.all(
    notificationCloseButtons.map(handle => handle.click())
  )

  return !!notificationCloseButtons.length && delay(1000) // delayed for alerts to animate off
}

const signIntoTerra = async (page, token) => {
  await page.waitForXPath('//*[contains(normalize-space(.),"Loading Terra")]', { hidden: true })
  await waitForNoSpinners(page)
  return page.evaluate(token => window.forceSignIn(token), token)
}

const findElement = (page, xpath, options) => {
  return page.waitForXPath(xpath, options)
}

const svgText = ({ textContains }) => {
  return `//*[name()="text" and contains(normalize-space(.),"${textContains}")]`
}

const navChild = text => {
  return `//*[@role="navigation"]//a[contains(normalize-space(.),"${text}")]`
}

const elementInDataTableRow = (entityName, text) => {
  return `//*[@role="table"]//*[contains(.,"${entityName}")]/following-sibling::*[contains(.,"${text}")]`
}

const findInDataTableRow = (page, entityName, text) => {
  return findElement(page, elementInDataTableRow(entityName, text))
}

const openError = async page => {
  //close out any non-error notifications first
  await dismissNotifications(page)

  const errorDetails = await page.$x('(//a | //*[@role="button"] | //button)[contains(normalize-space(.),"Details")]')

  !!errorDetails[0] && await errorDetails[0].click()

  return !!errorDetails.length
}

const maybeSaveScreenshot = async page => {
  if( !screenshotDirPath) { return }
  try {
    const path = `${screenshotDirPath}/failure-${Date.now()}-${testName}.png`
    const failureNotificationDetailsPath = `${screenshotDirPath}/failureDetails-${Date.now()}-${testName}.png`

    await page.screenshot({ path, fullPage: true })

    const errorsPresent = await openError(page)

    if (errorsPresent) {
      await page.screenshot({ path: failureNotificationDetailsPath, fullPage: true })
    }

    if (screenshotBucket) {
      const storage = new Storage()
      await storage.bucket(screenshotBucket).upload(path)
      if (errorsPresent) {
        await storage.bucket(screenshotBucket).upload(failureNotificationDetailsPath)
      }
    }
  } catch (e) {
    console.error('Failed to capture screenshot', e)
  }
}

const withScreenshot = _.curry((testName, fn) => async options => {
  try {
    return await fn(options)
  } catch (e) {
    await maybeSaveScreenshot(options.page)
    throw e
  }
})

module.exports = {
  click,
  clickable,
  dismissNotifications,
  findIframe,
  findInGrid,
  findElement,
  findText,
  fillIn,
  fillInReplace,
  input,
  select,
  svgText,
  waitForNoSpinners,
  delay,
  signIntoTerra,
  navChild,
  elementInDataTableRow,
  findInDataTableRow,
  withScreenshot,
  openError
}
