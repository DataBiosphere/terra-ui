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

const findInGrid = async (page, text) => {
  return await page.waitForXPath(`//*[@role="grid"][contains(normalize-space(.),"${text}")]`)
}

const exactlyFindClickable = (page, text) => {
  return page.waitForXPath(`(//a | //*[@role="button"] | //button)[normalize-space(.)="${text}"]`)
}

const exactClick = async (page, text) => {
  return (await exactlyFindClickable(page, text)).click()
}

const findClickable = (page, text) => {
  return page.waitForXPath(`(//a | //*[@role="button"] | //button)[contains(normalize-space(.),"${text}") or contains(@aria-label,"${text}")]`)
}

const click = async (page, text) => {
  return (await findClickable(page, text)).click()
}

const findText = (page, text) => {
  return page.waitForXPath(`//*[contains(normalize-space(.),"${text}")]`)
}

const findInput = (page, label) => {
  return page.waitForXPath(`(//input | //textarea)[contains(@aria-label,"${label}") or @id=//label[contains(normalize-space(.),"${label}")]/@for]`)
}

const fillIn = async (page, label, text) => {
  return (await findInput(page, label)).type(text, { delay: 20 })
}

const select = async (page, label, text) => {
  (await findInput(page, label)).click()
  return (await page.waitForXPath(`//div[starts-with(@id, "react-select-") and contains(normalize-space(.),"${text}")]`)).click()
}

const waitForNoSpinners = page => {
  return page.waitForXPath('//*[@data-icon="loadingSpinner"]', { hidden: true })
}

const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const signIntoTerra = async page => {
  await findText(page, 'requires a Google Account')
  return page.evaluate(token => window.forceSignIn(token), process.env.TERRA_TOKEN)
}

module.exports = {
  click,
  exactClick,
  exactlyFindClickable,
  findClickable,
  findIframe,
  findInGrid,
  findInput,
  findText,
  fillIn,
  select,
  waitForNoSpinners,
  delay,
  signIntoTerra
}
