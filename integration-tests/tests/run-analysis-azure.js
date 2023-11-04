// This test is owned by the Interactive Analysis (IA) Team.
const _ = require('lodash/fp');
const uuid = require('uuid');
const { deleteRuntimesV2, withWorkspaceAzure, performAnalysisTabSetup } = require('../utils/integration-helpers');
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

const testRunAnalysisAzure = _.flowRight(
  withUserToken,
  withWorkspaceAzure
)(async ({ billingProject, workspaceName, page, testUrl, token }) => {
  await performAnalysisTabSetup(page, token, testUrl, workspaceName);
  await delay(Millis.ofSeconds(10));

  // Create analysis file
  await click(page, clickable({ textContains: 'Start' }));
  await findElement(page, getAnimatedDrawer('Select an application'), { timeout: Millis.ofMinutes(1) });
  await click(page, image({ text: 'Create new notebook' }));
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName);
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create Analysis' })) });

  // Close the create cloud env modal that pops up
  await noSpinnersAfter(page, {
    action: () => findText(page, 'A cloud environment consists of application configuration, cloud compute and persistent disk(s).'),
    timeout: Millis.ofMinutes(1),
  });

  await click(page, clickable({ textContains: 'Close' }));
  await delay(Millis.ofSecond);

  // The Compute Modal does not close quickly enough, so the subsequent click does not properly click on the element
  // await delay(Millis.ofMinute);

  // Navigate to analysis launcher
  await click(page, `//*[@title="${notebookName}.ipynb"]`, { timeout: Millis.ofSeconds(30) });
  await dismissNotifications(page);
  await delay(Millis.ofSecond);

  await click(page, clickable({ textContains: 'Open' }));
  await delay(Millis.ofSecond);

  // TODO [] why does this click not work automatically? I had to manually click it
  // Create a cloud env from analysis launcher. try a few clicks
  await click(page, clickable({ textContains: 'Create' }));

  // The Compute Modal does not close quickly enough, so the subsequent click does not properly click on the element
  // await delay(Millis.ofMinute);

  await findElement(page, clickable({ textContains: 'JupyterLab Environment' }), { timeout: Millis.ofSeconds(40) });
  await findElement(page, clickable({ textContains: 'Creating' }), { timeout: Millis.ofSeconds(40) });

  // Wait for the environment to be running
  await findElement(page, clickable({ textContains: 'Running' }), { timeout: Millis.ofMinutes(15) });
  await click(page, clickable({ textContains: 'Open' }));

  // Find the iframe, wait until the Jupyter kernel is ready, and execute some code
  const frame = await findIframe(page, '//iframe[@title="Interactive JupyterLab iframe"]', { timeout: Millis.ofMinute });

  await findText(page, 'Kernel status: Idle', { timeout: Millis.ofMinute });
  await fillIn(frame, '//textarea', 'print(123456789099876543210990+9876543219)');
  await click(frame, clickable({ text: 'Run' }));
  await findText(frame, '123456789099886419754209');

  // Save notebook to avoid "unsaved changes" modal when test tear-down tries to close the window
  await click(frame, clickable({ text: 'Save and create checkpoint' }));
  await deleteRuntimesV2({ page, billingProject, workspaceName });
});

registerTest({
  name: 'run-analysis-azure',
  fn: testRunAnalysisAzure,
  timeout: Millis.ofMinutes(20),
});
