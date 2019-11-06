const {
  TEST_URL: testUrl = 'http://localhost:3000',
  TERRA_TOKEN: bearerToken,
  BILLING_PROJECT: billingProject = 'general-dev-billing-account',
  WORKFLOW_NAME: workflowName = 'haplotypecaller-gvcf-gatk4',
  SCREENSHOT_DIR: screenshotDir = 'failure-screenshots'
} = process.env

module.exports = {
  bearerToken,
  billingProject,
  testUrl,
  workflowName,
  screenshotDir
}
