const rawConsole = require('console')
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

const getClickablePath = (path, text, textContains, isDescendant = false) => {
  const base = `${path}${isDescendant ? '//*' : ''}`
  if (text) {
    return `${base}[normalize-space(.)="${text}" or @title="${text}" or @alt="${text}" or @aria-label="${text}" or @aria-labelledby=//*[normalize-space(.)="${text}"]/@id]`
  } else if (textContains) {
    return `${base}[contains(normalize-space(.),"${textContains}") or contains(@title,"${textContains}") or contains(@alt,"${textContains}") or contains(@aria-label,"${textContains}") or @aria-labelledby=//*[contains(normalize-space(.),"${textContains}")]/@id]`
  }
}

const getAnimatedDrawer = textContains => {
  return `//*[@role="dialog" and @aria-hidden="false"][contains(normalize-space(.), "${textContains}") or contains(@aria-label,"${textContains}") or @aria-labelledby=//*[contains(normalize-space(.),"${textContains}")]]`
}

// Note: isEnabled is not fully supported for native anchor and button elements (only aria-disabled is examined).
const clickable = ({ text, textContains, isDescendant = false, isEnabled = true }) => {
  const checkEnabled = isEnabled === false ? '[@aria-disabled="true"]' : '[not(@aria-disabled="true")]'
  const base = `(//a | //button | //*[@role="button"] | //*[@role="link"] | //*[@role="combobox"] | //*[@role="option"] | //*[@role="tab"])${checkEnabled}`
  return getClickablePath(base, text, textContains, isDescendant)
}

const image = ({ text, textContains, isDescendant = false }) => {
  const base = '(//img[@alt])'
  return getClickablePath(base, text, textContains, isDescendant)
}

const checkbox = ({ text, textContains, isDescendant = false }) => {
  const base = '(//input[@type="checkbox"] | //*[@role="checkbox"])'
  return getClickablePath(base, text, textContains, isDescendant)
}

const getTableCellPath = (tableName, row, column) => {
  return `//*[@role="table" and @aria-label="${tableName}"]//*[@role="row"][${row}]//*[@role="cell"][${column}]`
}

const getTableColIndex = async (page, { tableName, columnHeader }) => {
  const colHeaderNode = await findElement(page, `//*[@role="table" and @aria-label="${tableName}"]//*[@role="columnheader" and @aria-colindex and contains(normalize-space(.),"${columnHeader}")]`)
  return page.evaluate(node => node.getAttribute('aria-colindex'), colHeaderNode)
}

const getTableTextWithinColumn = async (page, { tableName, columnHeader, textContains, isDescendant = false }) => {
  const colIndex = await getTableColIndex(page, { tableName, columnHeader })
  const baseXpath = `//*[@role="table" and @aria-label="${tableName}"]//*[@role="row"]//*[@role="cell" and @aria-colindex = "${colIndex}"]`
  const xpath = `${baseXpath}${isDescendant ? '//*' : ''}[contains(normalize-space(.),"${textContains}")]`
  return xpath
}

const assertRowMatches = async (page, { tableName, expectedColumnValues, forRowContaining:{ column, textContains }, isDescendant = false }) => {
  const rowIndex = await getTableRowIndex(page, { tableName, columnHeader:column, textContains })
  console.log('expectedColumnValues', expectedColumnValues)

  //const trace = message => value => {
  //  console.log(message, value)
  //  return value
  //}

  const findTextInColumn = async ([columnHeader, text]) => {
    const colIndex = await getTableColIndex(page, { tableName, columnHeader })
    const baseXpath = `//*[@role="table" and @aria-label="${tableName}"]//*[@role="row"]//*[@role="cell" and @aria-rowindex = "${rowIndex}" and @aria-colindex = "${colIndex}"]`
    const colXPath = `${baseXpath}${isDescendant ? '//*' : ''}[contains(normalize-space(.),"${text}")]`
    return await findElement(page, colXPath, {timeout:5000})
  }

  // this flow will return an array of promises you can use Promise.all to resolve
  const findAllItemsInRow = _.flow(
    _.toPairs,
    _.map(findTextInColumn)
  )(expectedColumnValues)
  return Promise.all(findAllItemsInRow)
}

const getTableRowIndex = async (page, { tableName, columnHeader, textContains, isDescendant = false }) => {
  const colXPath = await getTableTextWithinColumn(page, { tableName, columnHeader, textContains, isDescendant })
  const findCol = await findElement(page, colXPath)
  return page.evaluate(node => node.getAttribute('aria-rowindex'), findCol)
}

const findTableTextWithinColumn = async (page, { tableName, columnHeader, textContains, isDescendant = false }, options) => {
  const xpath = await getTableTextWithinColumn(page, { tableName, columnHeader, textContains, isDescendant })
  return page.waitForXPath(xpath, options)
}

const clickTableCell = async (page, { tableName, columnHeader, textContains, isDescendant = false }, options) => {
  const tableCellPath = await getTableTextWithinColumn(page, { tableName, columnHeader, textContains, isDescendant })
  const xpath = `${tableCellPath}//*[@role="button" or @role="link" or @role="checkbox"]`
  return (await page.waitForXPath(xpath, options)).click()
}

const click = async (page, xpath, options) => {
  return (await page.waitForXPath(xpath, options)).click()
}

const findText = (page, textContains, options) => {
  return page.waitForXPath(`//*[contains(normalize-space(.),"${textContains}")]`, options)
}

const assertTextNotFound = async (page, text) => {
  let found = false
  try {
    await findText(page, text, { timeout: 5 * 1000 })
    found = true
  } catch (e) {}
  if (found) {
    throw new Error(`The specified text ${text} was found on the page, but it was not expected`)
  }
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

// Puppeteer works by internally using MutationObserver. We are setting up the listener before
// the action to ensure that the spinner rendering is captured by the observer, followed by
// waiting for the spinner to be removed
const noSpinnersAfter = async (page, { action, debugMessage }) => {
  if (debugMessage) {
    rawConsole.log(`About to perform an action and wait for spinners. \n\tDebug message: ${debugMessage}`)
  }
  const foundSpinner = page.waitForXPath('//*[@data-icon="loadingSpinner"]')
  await Promise.all([foundSpinner, action()])
  return waitForNoSpinners(page)
}

const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const dismissNotifications = async page => {
  await delay(3000) // delayed for any alerts to show
  const notificationCloseButtons = await page.$x(
    '(//a | //*[@role="button"] | //button)[contains(@aria-label,"Dismiss") and not(contains(@aria-label,"error"))]')

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

const heading = ({ level, text, textContains, isDescendant = false }) => {
  const tag = `h${level}`
  const aria = `*[@role="heading" and @aria-level=${level}]`
  const textExpression = `${isDescendant ? '//*' : ''}[normalize-space(.)="${text}"]`
  const textContainsExpression = `${isDescendant ? '//*' : ''}[contains(normalize-space(.),"${textContains}")]`

  // These are a bit verbose because the ancestor portion of the expression does not handle 'or' cases
  if (text) {
    return `(//${tag}${textExpression}//ancestor-or-self::${tag} | //${aria}${textExpression}//ancestor-or-self::${aria})`
  } else if (textContains) {
    return `(//${tag}${textContainsExpression}//ancestor-or-self::${tag} | //${aria}${textContainsExpression}//ancestor-or-self::${aria})`
  }
}

const findHeading = (page, xpath, options) => {
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

const maybeSaveScreenshot = async (page, testName) => {
  if (!screenshotDirPath) { return }
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
    rawConsole.error('Failed to capture screenshot', e)
  }
}

const withScreenshot = _.curry((testName, fn) => async options => {
  try {
    return await fn(options)
  } catch (e) {
    await maybeSaveScreenshot(options.page, testName)
    throw e
  }
})

const logPageConsoleMessages = page => {
  const handle = msg => rawConsole.log('page.console', msg.text(), msg)
  page.on('console', handle)
  return () => page.off('console', handle)
}

const logPageAjaxResponses = page => {
  const handle = res => {
    rawConsole.log('page.http.res', `${res.status()} ${res.request().method()} ${res.url()}`)
  }
  page.on('response', handle)
  return () => page.off('response', handle)
}

const withPageLogging = fn => options => {
  const { page } = options
  logPageAjaxResponses(page)
  // Leaving console logging off for now since it is mostly request failures already logged above.
  // logPageConsoleMessages(page)
  return fn(options)
}

module.exports = {
  assertTextNotFound,
  assertRowMatches,
  checkbox,
  click,
  clickable,
  clickTableCell,
  dismissNotifications,
  findIframe,
  findInGrid,
  findElement,
  findHeading,
  findTableTextWithinColumn,
  findText,
  fillIn,
  fillInReplace,
  getAnimatedDrawer,
  getTableCellPath,
  getTableColIndex,
  getTableRowIndex,
  heading,
  image,
  input,
  select,
  svgText,
  delay,
  signIntoTerra,
  navChild,
  elementInDataTableRow,
  findInDataTableRow,
  withScreenshot,
  logPageConsoleMessages,
  logPageAjaxResponses,
  noSpinnersAfter,
  waitForNoSpinners,
  withPageLogging,
  openError
}
