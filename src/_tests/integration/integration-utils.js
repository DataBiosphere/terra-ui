const waitForFrame = async url => {
  const frameLoaded = new Promise(resolve => {
    const navHandler = async frame => {
      await frame.url().includes(url) && resolve({ frame, navHandler })
    }
    page.on('framenavigated', navHandler)
  })

  const { frame, navHandler } = await frameLoaded
  page.removeListener('framenavigated', navHandler)
  return frame
}

const findIframe = async page => {
  const iframeNode = await page.waitForXPath('//*[@role="main"]/iframe')
  const srcHandle = await iframeNode.getProperty('src')
  const src = await srcHandle.jsonValue()

  return await waitForFrame(src)
}

const findInGrid = async (page, text) => {
  return await page.waitForXPath(`//*[@role="grid"][contains(normalize-space(.),"${text}")]`)
}

const exactlyFindClickable = (page, text) => {
  return page.waitForXPath(`(//a | //*[@role="button"] | //button)[text()="${text}"]`)
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
  waitForNoSpinners
}
