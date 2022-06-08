const findButtonInCloudEnvDetailsDialog = (page, ariaLabelButtonText) => {
  return page.waitForXPath(`//*[@role="dialog" and @aria-hidden="false"]//*[@role="button" and contains(@aria-label,"${ariaLabelButtonText}")]`,
    { visible: true }
  )
}

module.exports = { findButtonInCloudEnvDetailsDialog }
