const {
  LYLE_SA_KEY: lyleKey,
  LYLE_URL: lyleUrl = 'https://terra-lyle.appspot.com',
  SCREENSHOT_DIR: screenshotDir,
  TERRA_SA_KEY: terraSaKeyJson,
  TERRA_USER_EMAIL: userEmail = 'Scarlett.Flowerpicker@test.firecloud.org',
  WORKFLOW_NAME: workflowName = 'echo_to_file'
} = process.env

module.exports = {
  lyleKey,
  lyleUrl,
  screenshotDir,
  terraSaKeyJson,
  userEmail,
  workflowName
}
