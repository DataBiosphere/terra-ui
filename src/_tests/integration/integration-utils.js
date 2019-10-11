const findClickable = (page, text) => {
  return page.waitForXPath(`(//a | //*[@role="button"])[contains(normalize-space(.),"${text}") or contains(@aria-label,"${text}")]`)
}

const findIframe = (page, text) => {
  return page.frames().find(frame => {
    // console.log('FRAME:', frame.url())
    // console.log('FRAME:', frame.executionContext())
    return frame.url().includes(text)
  })
  // return page.waitForXPath(`//iframe[contains(normalize-space(@title),"${text}")]`)
}

const findSVG = (frame, text) => {
  return frame.$x(`${text}`)
}

const clickImage = async (page, text) => {
  return (await findClickableImage(page, text).click())
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
  findClickable,
  findIframe,
  findSVG,
  // findClickableImage,
  click,
  clickImage,
  findText,
  findInput,
  fillIn,
  select,
  waitForNoSpinners
}
