// This test is owned by the Interactive Analysis (IA) Team.
const _ = require('lodash/fp');
const uuid = require('uuid');
const { deleteRuntimes, withWorkspace, gotoAnalysisTab } = require('../utils/integration-helpers');
const {
  Millis,
  click,
  clickable,
  delay,
  dismissInfoNotifications,
  fillIn,
  findElement,
  findErrorPopup,
  findIframe,
  findText,
  getAnimatedDrawer,
  input,
  noSpinnersAfter,
  openError,
  waitForNoModal,
} = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const notebookName = `test-notebook-${uuid.v4()}`;

const testRunAnalysisFn = _.flowRight(
  withUserToken,
  withWorkspace
)(async ({ billingProject, workspaceName, page, testUrl, token }) => {
  await gotoAnalysisTab(page, token, testUrl, workspaceName);

  // Create analysis file
  await click(page, clickable({ textContains: 'Start' }));
  await findElement(page, getAnimatedDrawer('Select an application'), { timeout: Millis.ofMinute });
  await click(page, clickable({ text: 'Create new notebook', isDescendant: true }));
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName);
  await noSpinnersAfter(page, {
    action: () => click(page, clickable({ text: 'Create Analysis' }), { timeout: Millis.ofMinute }),
    timeout: Millis.ofMinute,
  });

  // Close the create cloud env modal that pops up
  // TODO [IA-4726] fix transition from create-analysis to cloud-environment modal
  await noSpinnersAfter(page, {
    action: () => findText(page, 'Jupyter Cloud Environment'),
    timeout: Millis.ofMinute,
  });
  await click(page, clickable({ textContains: 'Close', isEnabled: true }), { timeout: Millis.ofMinute });
  await waitForNoModal(page);

  // Navigate to analysis launcher
  await click(page, `//*[@title="${notebookName}.ipynb"]`);
  await dismissInfoNotifications(page);
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

  // Wait for env to finish creating, or break early on error
  await Promise.race([
    findElement(page, clickable({ textContains: 'Running' }), { timeout: Millis.ofMinutes(12) }),
    findErrorPopup(page, { timeout: Millis.ofMinutes(12) }),
  ]);
  const hasError = await openError(page);
  if (hasError) {
    throw new Error('Failed to create cloud environment');
  }

  await click(page, clickable({ textContains: 'Open' }));

  // Find the iframe, wait until the Jupyter kernel is ready, and execute some code
  const frame = await findIframe(page, '//iframe[@id="analysis-iframe"]', { timeout: Millis.ofMinute });

  await findElement(frame, '//*[@title="Kernel Idle"]', { timeout: Millis.ofMinute });

  // Wait for stable UI (sometimes kernel status flickers and fillIn won't work)
  await delay(Millis.ofSeconds(3));
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
