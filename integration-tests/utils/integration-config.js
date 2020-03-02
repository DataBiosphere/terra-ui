const {
  BILLING_PROJECT: billingProject = 'saturn-integration-test-dev',
  LYLE_SA_KEY: lyleKey,
  LYLE_URL: lyleUrl = 'https://terra-lyle.appspot.com',
  SCREENSHOT_DIR: screenshotDir,
  TERRA_SA_KEY: terraSaKeyJson,
  TERRA_TOKEN: bearerToken,
  TERRA_USER_EMAIL: userEmail = 'Scarlett.Flowerpicker@test.firecloud.org',
  TEST_URL: testUrl = 'http://localhost:3000',
  WORKFLOW_NAME: workflowName = 'echo_to_file'
} = process.env

module.exports = {
  bearerToken,
  billingProject,
  lyleKey,
  lyleUrl,
  screenshotDir,
  terraSaKeyJson,
  testUrl,
  userEmail,
  workflowName
}
