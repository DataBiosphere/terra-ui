// This test is owned by the Interactive Analysis (IA) Team.
const _ = require('lodash/fp');
const uuid = require('uuid');
const { withAzureWorkspace, gotoAnalysisTab } = require('../utils/integration-helpers');
const {
  Millis,
  click,
  clickable,
  delay,
  dismissNotifications,
  fillIn,
  findElement,
  findErrorPopup,
  findIframe,
  findText,
  getAnimatedDrawer,
  image,
  input,
  noSpinnersAfter,
  openError,
  waitForNoModal,
} = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const notebookName = `test-notebook-${uuid.v4()}`;

const testRunAnalysisAzure = _.flowRight(
  withUserToken,
  withAzureWorkspace
)(async ({ workspaceName, page, testUrl, token }) => {
  await gotoAnalysisTab(page, token, testUrl, workspaceName);

  // Create analysis file
  await click(page, clickable({ textContains: 'Start' }));
  await findElement(page, getAnimatedDrawer('Select an application'));
  await click(page, image({ text: 'Create new notebook' }));
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName);
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create Analysis' })) });

  // Dismiss the create env modal for now
  await noSpinnersAfter(page, {
    action: () =>
      findText(
        page,
        'A cloud environment consists of application configuration, cloud compute and persistent disk(s).'
      ),
  });
  await click(page, clickable({ textContains: 'Close' }));
  await waitForNoModal(page);

  // Navigate to analysis launcher
  await click(page, `//*[@title="${notebookName}.ipynb"]`);
  await dismissNotifications(page);
  await findText(page, 'PREVIEW (READ-ONLY)');

  // Attempt to open analysis; create a cloud env
  await click(page, clickable({ textContains: 'Open' }));
  await findText(page, 'Azure Cloud Environment');
  await click(page, clickable({ textContains: 'Create' }));
  await waitForNoModal(page);

  // Wait for env to begin creating
  await findElement(page, clickable({ textContains: 'JupyterLab Environment' }));
  await findElement(page, clickable({ textContains: 'Creating' }));

  // Wait for env to finish creating, or break early on error
  await Promise.race([
    findElement(page, clickable({ textContains: 'Running' }), { timeout: Millis.ofMinutes(15) }),
    findErrorPopup(page, { timeout: Millis.ofMinutes(15) }),
  ]);
  const hasError = await openError(page);
  if (hasError) {
    throw new Error('Failed to create cloud environment');
  }

  await click(page, clickable({ textContains: 'Open' }));

  // Find the iframe and wait until the Jupyter kernel is ready
  const frame = await findIframe(page, '//iframe[@title="Interactive JupyterLab iframe"]', {
    timeout: Millis.ofMinutes(2),
  });
  await findText(frame, 'Kernel status: Idle', { timeout: Millis.ofMinutes(4) });

  // Test runs occasionally swallow the entered text; will a timeout stabilize this?
  await delay(Millis.ofSeconds(10));

  // Run a command
  await fillIn(
    frame,
    '//*[contains(@class,"jp-Notebook-cell")][last()]//textArea',
    'print(123456789099876543210990+9876543219)',
    { initialDelay: Millis.ofSecond }
  );
  await click(frame, '//button[starts-with(@title, "Run the selected cells and advance")]');
  await findText(frame, '123456789099886419754209');

  // Save notebook to avoid "unsaved changes" modal when test tear-down tries to close the window
  await click(frame, '//button[starts-with(@title, "Save and create checkpoint")]');

  // Cleanup: rely on workspace deletion to delete the runtime. "Deleting" status is not considered deletable by Leonardo,
  // so deletes are not idempotent (a second request to delete will trigger an error 409 and block workspace deletion)
});

registerTest({
  name: 'run-analysis-azure',
  fn: testRunAnalysisAzure,
  targetEnvironments: ['dev', 'staging'],
  timeout: Millis.ofMinutes(20),
});
