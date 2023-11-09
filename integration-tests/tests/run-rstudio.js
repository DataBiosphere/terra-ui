// This test is owned by the Interactive Analysis (IA) Team.
const _ = require('lodash/fp');
const { deleteRuntimes, withWorkspace, gotoAnalysisTab } = require('../utils/integration-helpers');
const {
  Millis,
  click,
  clickable,
  delay,
  dismissNotifications,
  fillIn,
  findElement,
  findIframe,
  findText,
  getAnimatedDrawer,
  image,
  input,
  noSpinnersAfter,
} = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const rFileName = 'test-rmd';

const testRunRStudioFn = _.flowRight(
  withUserToken,
  withWorkspace
)(async ({ billingProject, workspaceName, page, testUrl, token }) => {
  await gotoAnalysisTab(page, token, testUrl, workspaceName);

  // Create analysis file
  await click(page, clickable({ textContains: 'Start' }));
  await findElement(page, getAnimatedDrawer('Select an application'));
  await click(page, image({ text: 'Create new R file' }));
  await fillIn(page, input({ placeholder: 'Enter a name' }), rFileName);
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create Analysis' })) });

  // Close the create cloud env modal that pops up
  await noSpinnersAfter(page, {
    action: () => findText(page, 'A cloud environment consists of application configuration, cloud compute and persistent disk(s).'),
  });

  await click(page, clickable({ textContains: 'Close' }));

  // The Compute Modal does not close quickly enough, so the subsequent click does not properly click on the element
  await delay(200);

  // Navigate to analysis launcher
  await click(page, `//*[@title="${rFileName}.Rmd"]`, { timeout: Millis.ofSeconds(30) });
  await dismissNotifications(page);

  await noSpinnersAfter(page, {
    action: () => click(page, clickable({ textContains: 'Open' })),
  });

  // Create a cloud env from analysis launcher
  await click(page, clickable({ text: 'Create' }));

  // The Compute Modal does not close quickly enough, so the subsequent click does not properly click on the element
  await delay(200);

  await findElement(page, clickable({ textContains: 'RStudio Environment' }), { timeout: Millis.ofMinutes(2) });
  await findElement(page, clickable({ textContains: 'Creating' }), { timeout: Millis.ofSeconds(40) });

  // Wait for the environment to be running
  await findElement(page, clickable({ textContains: 'Running' }), { timeout: Millis.ofMinutes(10) });
  await dismissNotifications(page);
  await click(page, clickable({ textContains: 'Open' }));

  // Find the iframe, wait until the RStudio iframe is loaded, and execute some code
  const frame = await findIframe(page, '//iframe[@title="Interactive RStudio iframe"]');

  await findElement(frame, '//*[@id="rstudio_container"]', { timeout: Millis.ofMinute });
  await fillIn(frame, '//textarea', 'x=1;x');
  await page.keyboard.press('Enter');
  await findText(frame, '[1] 1');

  await dismissNotifications(page);

  await deleteRuntimes({ page, billingProject, workspaceName });
});

registerTest({
  name: 'run-rstudio',
  fn: testRunRStudioFn,
  timeout: Millis.ofMinutes(12),
});
