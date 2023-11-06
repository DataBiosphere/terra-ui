// This test is owned by the Interactive Analysis (IA) Team.
const _ = require('lodash/fp');
const uuid = require('uuid');
const { deleteAppsV2, deleteRuntimesV2, withWorkspaceAzure, performAnalysisTabSetup } = require('../utils/integration-helpers');
const {
  click,
  clickable,
  delay,
  findElement,
  noSpinnersAfter,
  fillIn,
  findIframe,
  findText,
  dismissNotifications,
  getAnimatedDrawer,
  image,
  input,
  Millis,
} = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const notebookName = `test-notebook-${uuid.v4()}`;
const waitAMinute = { timeout: Millis.ofMinute };

const testRunAnalysisAzure = _.flowRight(
  withUserToken,
  withWorkspaceAzure
)(async ({ billingProject, workspaceName, page, testUrl, token }) => {
  await performAnalysisTabSetup(page, token, testUrl, workspaceName);
  await delay(Millis.ofSeconds(10));

  // Create analysis file
  await click(page, clickable({ textContains: 'Start' }), waitAMinute);
  await findElement(page, getAnimatedDrawer('Select an application'), waitAMinute);
  await click(page, image({ text: 'Create new notebook' }), waitAMinute);
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName);
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create Analysis' }), waitAMinute) });
  await delay(Millis.ofSeconds(20));

  // Close the create cloud env modal that pops up
  await noSpinnersAfter(page, {
    action: () => findText(page, 'A cloud environment consists of application configuration, cloud compute and persistent disk(s).', waitAMinute),
    timeout: Millis.ofSeconds(45),
  }).catch(() => findText(page, 'A cloud environment consists of application configuration, cloud compute and persistent disk(s).', waitAMinute));

  await click(page, clickable({ textContains: 'Close' }), waitAMinute);

  // The Compute Modal does not close quickly enough, so the subsequent click does not properly click on the element
  await delay(Millis.ofSeconds(20));

  // Navigate to analysis launcher
  await click(page, `//*[@title="${notebookName}.ipynb"]`, waitAMinute);
  await dismissNotifications(page);
  await delay(Millis.ofSeconds(10));

  await click(page, clickable({ textContains: 'Open' }), { timeout: Millis.ofMinutes(2) });

  // Create a cloud env from analysis launcher
  await click(page, clickable({ textContains: 'Create' }), waitAMinute);

  // The Compute Modal does not close quickly enough, so the subsequent click does not properly click on the element
  await delay(Millis.ofSeconds(2));

  await findElement(page, clickable({ textContains: 'JupyterLab Environment' }), waitAMinute);
  await findElement(page, clickable({ textContains: 'Creating' }), waitAMinute);

  // Wait for the environment to be running
  await findElement(page, clickable({ textContains: 'Running' }), { timeout: Millis.ofMinutes(15) });
  await click(page, clickable({ textContains: 'Open' }), waitAMinute);

  // Find the iframe, wait until the Jupyter kernel is ready, and execute some code
  const frame = await findIframe(page, '//iframe[@title="Interactive JupyterLab iframe"]', { timeout: Millis.ofMinutes(2) });

  await findText(frame, 'Kernel status: Idle', { timeout: Millis.ofMinutes(2) });
  await fillIn(frame, '//textarea', 'print(123456789099876543210990+9876543219)');
  await delay(Millis.ofSeconds(2));

  await click(frame, clickable({ textContains: 'Run the selected cells and advance' }));
  await findText(frame, '123456789099886419754209');

  // Save notebook to avoid "unsaved changes" modal when test tear-down tries to close the window
  await click(frame, clickable({ text: 'Save and create checkpoint' }));

  // Cleanup
  await deleteRuntimesV2({ page, billingProject, workspaceName });
  await deleteAppsV2({ page, billingProject, workspaceName });
});

registerTest({
  name: 'run-analysis-azure',
  fn: testRunAnalysisAzure,
  timeout: Millis.ofMinutes(20),
});
