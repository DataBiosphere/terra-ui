const { bearerToken } = require('./integration-config')


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
  return page.waitForXPath(`//*[@role="grid"][contains(normalize-space(.),"${textContains}")]`, options)
}

const clickable = ({ text, textContains }) => {
  const base = '(//a | //*[@role="button"] | //button)'
  if (text) {
    return `${base}[normalize-space(.)="${text}" or @aria-label="${text}"]`
  } else if (textContains) {
    return `${base}[contains(normalize-space(.),"${textContains}") or contains(@aria-label,"${textContains}")]`
  }
}

const click = async (page, xpath) => {
  return (await page.waitForXPath(xpath)).click()
}

const findText = (page, textContains) => {
  return page.waitForXPath(`//*[contains(normalize-space(.),"${textContains}")]`)
}

const input = ({ labelContains, placeholder }) => {
  const base = '(//input | //textarea)'
  if (labelContains) {
    return `${base}[contains(@aria-label,"${labelContains}") or @id=//label[contains(normalize-space(.),"${labelContains}")]/@for]`
  } else if (placeholder) {
    return `${base}[@placeholder="${placeholder}"]`
  }
}

const fillIn = async (page, xpath, text) => {
  return (await page.waitForXPath(xpath)).type(text, { delay: 20 })
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
  if (await findElement(page, clickable({ text: 'Dismiss notification' }))) {
    const notificationCloseButtons = await page.$x(clickable({ text: 'Dismiss notification' }))

    return Promise.all(
      notificationCloseButtons.map(handle => handle.click())
    )
  }
}

const signIntoTerra = async (page, token = bearerToken) => {
  await page.waitForXPath('//*[contains(normalize-space(.),"Loading Terra")]', { hidden: true })
  await waitForNoSpinners(page)
  await page.evaluate(token => window.forceSignIn(token), token)
  await delay(3000)
  await dismissNotifications(page)
  return delay(1000)
}

const findElement = (page, xpath) => {
  return page.waitForXPath(xpath)
}

const svgText = ({ textContains }) => {
  return `//*[name()="text" and contains(normalize-space(.),"${textContains}")]`
}

const navChild = text => {
  return `//*[@role="navigation"]/*[contains(normalize-space(.),"${text}")]`
}

const findInDataTableRow = (page, entityName, text) => {
  return findElement(page, `//*[@role="grid"]//*[contains(.,"${entityName}")]/following-sibling::*[contains(.,"${text}")]`)
}

module.exports = {
  click,
  clickable,
  dismissNotifications,
  findIframe,
  findInGrid,
  findElement,
  findText,
  fillIn,
  input,
  select,
  svgText,
  waitForNoSpinners,
  delay,
  signIntoTerra,
  navChild,
  findInDataTableRow
}
