const findClickable = (page, text) => {
  return page.waitForXPath(`(//a | //*[@role="button"])[contains(normalize-space(.),"${text}") or contains(@aria-label,"${text}")]`)
}

const click = async (page, text) => {
  return (await findClickable(page, text)).click()
}

const findText = (page, text) => {
  return page.waitForXPath(`//*[contains(normalize-space(.),"${text}")]`)
}

const findInput = (page, label) => {
  return page.waitForXPath(`//input[contains(@aria-label,"${label}") or @id=//label[contains(normalize-space(.),"${label}")]/@for]`)
}

const fillIn = async (page, label, text) => {
  return (await findInput(page, label)).type(text, { delay: 20 })
}

const waitForNoSpinners = page => {
  return page.waitForXPath('//*[@data-icon="loadingSpinner"]', { hidden: true })
}

module.exports = {
  findClickable,
  click,
  findText,
  findInput,
  fillIn,
  waitForNoSpinners
}
