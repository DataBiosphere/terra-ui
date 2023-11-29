// This test is owned by the Interactive Analysis (IA) Team.
const _ = require('lodash/fp');
const { deleteRuntimes, withWorkspace, gotoAnalysisTab } = require('../utils/integration-helpers');
const {
  Millis,
  click,
  clickable,
  dismissNotifications,
  fillIn,
  findElement,
  findIframe,
  findText,
  getAnimatedDrawer,
  image,
  input,
  noSpinnersAfter,
  waitForNoModal,
} = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const notebookName = 'test-notebook';

const testRunAnalysisFn = _.flowRight(
  withUserToken,
  withWorkspace
)(async ({ billingProject, workspaceName, page, testUrl, token }) => {
  await gotoAnalysisTab(page, token, testUrl, workspaceName);

  // Create analysis file
  await click(page, clickable({ textContains: 'Start' }));
  await findElement(page, getAnimatedDrawer('Select an application'));
  await click(page, image({ text: 'Create new notebook' }));
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName);
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create Analysis' })) });

  // Dismiss the create env modal for now
  await noSpinnersAfter(page, {
    action: () => findText(page, 'A cloud environment consists of application configuration, cloud compute and persistent disk(s).'),
  });
  await click(page, clickable({ textContains: 'Close' }));
  await waitForNoModal(page);

  // Navigate to analysis launcher
  await click(page, `//*[@title="${notebookName}.ipynb"]`);
  await dismissNotifications(page);
  await findText(page, 'PREVIEW (READ-ONLY)');

  // Attempt to open analysis; create a cloud env
  await noSpinnersAfter(page, {
    action: () => click(page, clickable({ textContains: 'Open' })),
  });
  await findText(page, 'Jupyter Cloud Environment');
  await click(page, clickable({ text: 'Create' }));
  await waitForNoModal(page);

  // Wait for env to begin creating
  await findElement(page, clickable({ textContains: 'Jupyter Environment' }), { timeout: Millis.ofSeconds(40) });
  await findElement(page, clickable({ textContains: 'Creating' }), { timeout: Millis.ofSeconds(40) });

  // Wait for the environment to be running
  await findElement(page, clickable({ textContains: 'Jupyter Environment' }), { timeout: Millis.ofMinutes(10) });
  await findElement(page, clickable({ textContains: 'Running' }), { timeout: Millis.ofMinutes(10) });
  await click(page, clickable({ textContains: 'Open' }));

  // Find the iframe, wait until the Jupyter kernel is ready, and execute some code
  const frame = await findIframe(page, '//iframe[@id="analysis-iframe"]', { timeout: Millis.ofMinute });

  await findElement(frame, '//*[@title="Kernel Idle"]', { timeout: Millis.ofMinute });
  await fillIn(frame, '//textarea', 'print(123456789099876543210990+9876543219)');
  await click(frame, clickable({ text: 'Run' }));
  await findText(frame, '123456789099886419754209');

  // Save notebook to avoid "unsaved changes" modal when test tear-down tries to close the window
  await click(frame, clickable({ text: 'Save and Checkpoint' }));

  // Cleanup
  await deleteRuntimes({ page, billingProject, workspaceName });
});

registerTest({
  name: 'run-analysis',
  fn: testRunAnalysisFn,
  timeout: Millis.ofMinutes(20),
});
