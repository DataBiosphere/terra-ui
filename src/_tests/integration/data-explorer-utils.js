const dataExplorer = () => {
  const findInput = async (page, label) => {
    return await page.waitForXPath(`(//input | //textarea)[contains(@placeholder,"${label}") or @id=${label}]`)
  }

  const fillIn = async (page, label, text) => {
    return (await findInput(page, label)).type(text, { delay: 20 })
  }

  const findClickable = async (page, text) => {
    return await page.waitForXPath(`(//a | //*[@role="button"] | //button)//*[text() = "${text}"]`)
  }

  const click = async (page, text) => {
    return (await findClickable(page, text)).click()
  }

  const findTextInAnyNS = async (page, text) => {
    return await page.waitForXPath(`//*[name() = "text" and contains(normalize-space(.), '${text}')]`)
  }

  const clickTextInAnyNS = async (page, text) => {
    return (await findTextInAnyNS(page, text)).click()
  }

  return { findInput, fillIn, findClickable, click, findTextInAnyNS, clickTextInAnyNS }
}

module.exports = {
  dataExplorer: dataExplorer()
}
