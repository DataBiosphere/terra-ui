const {
  BILLING_PROJECT: billingProject = 'general-dev-billing-account',
  LYLE_SA_KEY: lyleToken,
  LYLE_URL: lyleUrl = 'https://terra-lyle.appspot.com',
  SCREENSHOT_DIR: screenshotDir,
  TERRA_TOKEN: bearerToken,
  TEST_URL: testUrl = 'http://localhost:3000',
  WORKFLOW_NAME: workflowName = 'echo_to_file'
} = process.env

module.exports = {
  bearerToken,
  billingProject,
  lyleToken,
  lyleUrl,
  screenshotDir,
  testUrl,
  workflowName
}
