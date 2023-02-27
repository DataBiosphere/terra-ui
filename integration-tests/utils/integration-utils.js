const { AxePuppeteer } = require('@axe-core/puppeteer')
const _ = require('lodash/fp')
const { mkdirSync, writeFileSync } = require('fs')
const { resolve } = require('path')
const { screenshotDirPath } = require('../utils/integration-config')
const pRetry = require('p-retry')


const defaultToVisibleTrue = _.defaults({ visible: true })

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

const findIframe = async (page, iframeXPath = '//*[@role="main"]/iframe') => {
  const iframeNode = await page.waitForXPath(iframeXPath)
  const srcHandle = await iframeNode.getProperty('src')
  const src = await srcHandle.jsonValue()
  const hasFrame = () => page.frames().find(frame => frame.url().includes(src))

  return hasFrame() || await waitForFn({ fn: hasFrame })
}

const findInGrid = (page, textContains, options) => {
  return page.waitForXPath(`//*[@role="table"][contains(normalize-space(.),"${textContains}")]`, defaultToVisibleTrue(options))
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
  const base = `(//a | //button | //div | //*[@role="button"] | //*[@role="link"] | //*[@role="combobox"] | //*[@role="option"] | //*[@role="switch"] | //*[@role="tab"])${checkEnabled}`
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
  const colHeaderNode = await findElement(page, `//*[@role="table" and @aria-label="${tableName}"]//*[@role="columnheader" and @aria-colindex][descendant-or-self::text() = "${columnHeader}"]`)
  return page.evaluate(node => node.getAttribute('aria-colindex'), colHeaderNode)
}

const getTableCellByContents = async (page, { tableName, columnHeader, text, isDescendant = false }) => {
  const colIndex = await getTableColIndex(page, { tableName, columnHeader })
  const baseXpath = `//*[@role="table" and @aria-label="${tableName}"]//*[@role="row"]//*[@role="cell" and @aria-colindex = "${colIndex}"]`
  const xpath = `${baseXpath}${isDescendant ? '//*' : ''}[text() = "${text}"]`
  return xpath
}

const getTableRowIndex = async (page, { tableName, columnHeader, text, isDescendant = false }) => {
  const colXPath = await getTableCellByContents(page, { tableName, columnHeader, text, isDescendant })
  const findCol = await findElement(page, colXPath)
  return page.evaluate(node => node.getAttribute('aria-rowindex'), findCol)
}

const assertRowHas = async (page, { tableName, expectedColumnValues, withKey: { column, text } }) => {
  const rowIndex = await getTableRowIndex(page, { tableName, columnHeader: column, text })

  const findTextInColumn = async ([columnHeader, colText]) => {
    const colIndex = await getTableColIndex(page, { tableName, columnHeader })
    const xPath = `//*[@role="table" and @aria-label="${tableName}"]//*[@role="row"]//*[@role="cell" and @aria-rowindex = "${rowIndex}" and @aria-colindex = "${colIndex}"][text() = "${colText}"]`
    return await findElement(page, xPath, { timeout: 5000 })
  }

  await Promise.all(_.map(findTextInColumn, expectedColumnValues))
}

const clickTableCell = async (page, { tableName, columnHeader, text, isDescendant = false }, options) => {
  const tableCellPath = await getTableCellByContents(page, { tableName, columnHeader, text, isDescendant })
  const xpath = `${tableCellPath}[@role="button" or @role="link" or @role="checkbox"]`
  return (await page.waitForXPath(xpath, options)).click()
}

const click = async (page, xpath, options) => {
  try {
    return (await page.waitForXPath(xpath, defaultToVisibleTrue(options))).click()
  } catch (e) {
    if (e.message.includes('Node is detached from document')) {
      return (await page.waitForXPath(xpath, defaultToVisibleTrue(options))).click()
    }
    throw e
  }
}

const findText = (page, textContains, options) => {
  return page.waitForXPath(`//*[contains(normalize-space(.),"${textContains}")]`, defaultToVisibleTrue(options))
}

const assertTextNotFound = async (page, text) => {
  let found = false
  try {
    await findText(page, text, { timeout: 5 * 1000 })
    found = true
  } catch (e) {}
  if (found) {
    throw new Error(`The specified text '${text}' was found on the page, but it was not expected`)
  }
}

const input = ({ labelContains, placeholder }) => {
  const base = '(//input | //textarea | //*[@role="switch"])'
  if (labelContains) {
    return `${base}[contains(@aria-label,"${labelContains}") or @id=//label[contains(normalize-space(.),"${labelContains}")]/@for or @aria-labelledby=//*[contains(normalize-space(.),"${labelContains}")]/@id]`
  } else if (placeholder) {
    return `${base}[@placeholder="${placeholder}"]`
  }
}

const label = ({ labelContains }) => {
  return `(//label[contains(normalize-space(.),"${labelContains}")])`
}

const fillIn = async (page, xpath, text) => {
  const input = await page.waitForXPath(xpath, defaultToVisibleTrue())
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
  return click(page, `//div[starts-with(@id, "react-select-") and @role="option" and contains(normalize-space(.),"${text}")]`)
}

const waitForNoSpinners = page => {
  return page.waitForXPath('//*[@data-icon="loadingSpinner"]', { hidden: true })
}

// Puppeteer works by internally using MutationObserver. We are setting up the listener before
// the action to ensure that the spinner rendering is captured by the observer, followed by
// waiting for the spinner to be removed
const noSpinnersAfter = async (page, { action, debugMessage }) => {
  if (debugMessage) {
    console.log(`About to perform an action and wait for spinners. \n\tDebug message: ${debugMessage}`)
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

const dismissNPSSurvey = async page => {
  let element
  try {
    element = await page.waitForXPath('//iframe[@aria-label="NPS Survey"]', { timeout: 1000 })
  } catch (e) {
    return // NPS survey was not found
  }
  try {
    console.log('dismissing NPS survey')
    const iframe = await element.contentFrame()
    const [closeButton] = await iframe.$x('.//*[normalize-space(.)="Ask Me Later"]')
    await closeButton.evaluate(button => button.click())
    await delay(500) // delayed for survey to animate off
  } catch (e) {
    console.error(e)
    throw e
  }
}

// Test workaround: Retry loading of Terra UI if fails first time. This issue often happens after new deploy to Staging/Alpha.
const signIntoTerra = async (page, { token, testUrl }) => {
  console.log('signIntoTerra ...')
  if (!!testUrl) {
    await gotoPage(page, testUrl)
  } else {
    await page.waitForXPath('//*[contains(normalize-space(.),"Loading Terra")]', { hidden: true })
  }

  await waitForNoSpinners(page)

  await page.waitForFunction('!!window["forceSignIn"]')
  await page.evaluate(token => window.forceSignIn(token), token)

  await dismissNotifications(page)
  await dismissNPSSurvey(page)
  await waitForNoSpinners(page)
}

const findElement = (page, xpath, options) => {
  return page.waitForXPath(xpath, defaultToVisibleTrue(options))
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

const assertNavChildNotFound = async (page, text) => {
  let found = false
  try {
    await page.waitForXPath(navChild(text), { timeout: 5 * 1000 })
    found = true
  } catch (e) {}
  if (found) {
    throw new Error(`The specified nav child '${text}' was found on the page, but it was not expected`)
  }
}

const elementInDataTableRow = (entityName, text) => {
  return `//*[@role="table"]//*[contains(.,"${entityName}")]/following-sibling::*[contains(.,"${text}")]`
}

const findInDataTableRow = (page, entityName, text) => {
  return findElement(page, elementInDataTableRow(entityName, text))
}

const findButtonInDialogByAriaLabel = (page, ariaLabelText) => {
  return page.waitForXPath(`//*[@role="dialog" and @aria-hidden="false"]//*[@role="button" and contains(@aria-label,"${ariaLabelText}")]`,
    { visible: true }
  )
}

const openError = async page => {
  //close out any non-error notifications first
  await dismissNotifications(page)

  const errorDetails = await page.$x('(//a | //*[@role="button"] | //button)[contains(normalize-space(.),"Details")]')

  !!errorDetails[0] && await errorDetails[0].click()

  return !!errorDetails.length
}

const getScreenshotDir = () => {
  const dir = screenshotDirPath ?
    screenshotDirPath :
    process.env.SCREENSHOT_DIR || process.env.LOG_DIR || resolve(__dirname, '../test-results/screenshots')
  mkdirSync(dir, { recursive: true })
  return dir
}

const maybeSaveScreenshot = async (page, testName) => {
  const dir = getScreenshotDir()
  try {
    const path = `${dir}/failure-${Date.now()}-${testName}.png`
    const failureNotificationDetailsPath = `${dir}/failureDetails-${Date.now()}-${testName}.png`

    await page.screenshot({ path, fullPage: true })
    console.log(`Captured screenshot: ${path}`)

    const errorsPresent = await openError(page)

    if (errorsPresent) {
      await page.screenshot({ path: failureNotificationDetailsPath, fullPage: true })
    }
  } catch (e) {
    console.error('Failed to capture screenshot', e)
  }
}

// Save page content to screenshot dir. Useful for test failure troubleshooting
const savePageContent = async (page, testName) => {
  const dir = getScreenshotDir()
  const htmlContent = await page.content()
  const htmlFile = `${dir}/failure-${Date.now()}-${testName}.html`
  try {
    writeFileSync(htmlFile, htmlContent, { encoding: 'utf8' })
    console.log(`Saved screenshot page content: ${htmlFile}`)
  } catch (e) {
    console.error('Failed to save screenshot page content')
    console.error(e)
    // Let test continue
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

// Emitted when the page crashes
const logError = page => {
  // this error will log an object of type [Error: ...] which is not very
  // informative and looks incorrect at first glance since the contents would be
  // more useful but in fact this is the best we can do here since the object
  // contents cannot be easily stringified otherwise you get {}
  const handle = msg => console.error('page.error', msg)
  page.on('error', handle)
  return () => page.off('error', handle)
}

// Emitted when an uncaught exception happens within the page
const logPageError = page => {
  // this error will log an object of type [Error: ...] which is not very
  // informative and looks incorrect at first glance since the contents would be
  // more useful but in fact this is the best we can do here since the object
  // contents cannot be easily stringified otherwise you get {}
  const handle = msg => console.error('page.pageerror', msg)
  page.on('pageerror', handle)
  return () => page.off('pageerror', handle)
}

const logPageConsoleMessages = page => {
  const handle = msg => console.log('page.console', msg.text())
  page.on('console', handle)
  return () => page.off('console', handle)
}

const logPageResponses = page => {
  const terraRequests = [
    'broad',
    'terra',
    'googleapis',
    'bvdp'
  ]
  const handle = response => {
    const request = response.request()
    const url = request.url()
    const shouldLogRequest = terraRequests.some(urlPart => url.includes(urlPart))
    if (shouldLogRequest) {
      const method = request.method()
      const status = response.status()
      console.log('page.http', `${method} ${status} ${url}`)

      const isErrorResponse = status >= 400
      if (isErrorResponse) {
        const responseIsJSON = response.headers()['content-type'] === 'application/json'
        response.text().then(content => {
          console.log('page.http.error', `${method} ${status} ${url}`, responseIsJSON ? JSON.parse(content) : content)
        }).catch(err => {
          console.error('page.http.error', 'Unable to get response content', err)
        })
      }
    }
  }
  page.on('response', handle)
  return () => page.off('response', handle)
}

const enablePageLogging = page => {
  logPageResponses(page)
  logPageConsoleMessages(page)
  logPageError(page)
  logError(page)
}

const withPageLogging = fn => async options => {
  const { page } = options
  enablePageLogging(page)
  return await fn(options)
}

const navOptionNetworkIdle = (timeout = 60 * 1000) => ({ waitUntil: ['networkidle0'], timeout })

const gotoPage = async (page, url) => {
  const retryOptions = {
    factor: 1,
    onFailedAttempt: error => {
      console.error(
        `Loading url attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
      )
    },
    retries: 2
  }

  const load = async url => {
    try {
      const httpResponse = await page.goto(url, navOptionNetworkIdle())
      if (httpResponse && !(httpResponse.ok() || httpResponse.status() === 304)) {
        throw new Error(`Error loading URL: ${url}. Http response status: ${httpResponse.statusText()}`)
      }
      await page.waitForXPath('//*[contains(normalize-space(.),"Loading Terra")]', { hidden: true })
    } catch (e) {
      console.error(e)
      // Stop page loading, as if you hit "X" in the browser. ignore exception.
      await page._client.send('Page.stopLoading').catch(err => void err)
      throw new Error(e)
    }
  }

  console.log(`Loading URL: ${url}`)
  await pRetry(() => load(url), retryOptions)
  await waitForNoSpinners(page)
}

const verifyAccessibility = async page => {
  const results = await new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa']).analyze()
  if (results.violations.length > 0) {
    throw new Error(`Accessibility issues found:\n${JSON.stringify(results.violations, null, 2)}`)
  }
}

module.exports = {
  assertNavChildNotFound,
  assertTextNotFound,
  assertRowHas,
  checkbox,
  click,
  clickable,
  clickTableCell,
  dismissNotifications,
  findIframe,
  findInGrid,
  findElement,
  findHeading,
  findText,
  fillIn,
  fillInReplace,
  getAnimatedDrawer,
  getTableCellPath,
  getTableColIndex,
  heading,
  image,
  input,
  label,
  select,
  svgText,
  delay,
  signIntoTerra,
  navChild,
  elementInDataTableRow,
  findInDataTableRow,
  withScreenshot,
  logPageConsoleMessages,
  noSpinnersAfter,
  waitForNoSpinners,
  withPageLogging,
  enablePageLogging,
  openError,
  navOptionNetworkIdle,
  maybeSaveScreenshot,
  gotoPage,
  savePageContent,
  findButtonInDialogByAriaLabel,
  verifyAccessibility
}
