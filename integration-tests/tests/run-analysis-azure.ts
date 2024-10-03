// This test is owned by the Interactive Analysis (IA) Team.
const _ = require('lodash/fp');
const uuid = require('uuid');
const {
  deleteRuntimesV2,
  getWorkspaceId,
  gotoAnalysisTab,
  withAzureWorkspace,
} = require('../utils/integration-helpers');
const {
  Millis,
  click,
  clickable,
  delay,
  dismissAllNotifications,
  dismissInfoNotifications,
  fillIn,
  findElement,
  findIframe,
  findText,
  getAnimatedDrawer,
  input,
  noSpinnersAfter,
  waitForNoModalDrawer,
  waitForNoSpinners,
} = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const notebookName = `test-notebook-${uuid.v4()}`;

const testRunAnalysisAzure = _.flowRight(
  withUserToken,
  withAzureWorkspace
)(async ({ page, billingProject, testUrl, token, workspaceName }) => {
  await gotoAnalysisTab(page, token, testUrl, workspaceName);

  // Create analysis file
  await click(page, clickable({ textContains: 'Start' }));
  await findElement(page, getAnimatedDrawer('Select an application'), { timeout: Millis.ofMinute });
  await click(page, clickable({ text: 'Create new notebook', isDescendant: true }));
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName);
  await noSpinnersAfter(page, {
    action: () => click(page, clickable({ text: 'Create Analysis' })),
    timeout: Millis.ofMinute,
  });

  // Dismiss the create env modal for now
  await noSpinnersAfter(page, {
    action: () => findText(page, 'Azure Cloud Environment'),
    timeout: Millis.ofMinute,
  });
  await click(page, clickable({ textContains: 'Close' }), { timeout: Millis.ofMinute });
  await waitForNoModalDrawer(page);
  // Debugging to see if waiting helps (still not clear if modal animation is causing the problem)
  await delay(Millis.ofSeconds(5));
  // In addition to spinners related to the side modal, there is a spinner over the page while content loads.
  await waitForNoSpinners(page);

  // Navigate to analysis launcher
  await click(page, clickable({ textContains: `${notebookName}.ipynb` }));
  await dismissInfoNotifications(page);
  await findText(page, 'PREVIEW (READ-ONLY)');
  await waitForNoSpinners(page);

  // Attempt to open analysis; create a cloud env
  await click(page, clickable({ textContains: 'Open' }));
  await findText(page, 'Azure Cloud Environment');
  await click(page, clickable({ textContains: 'Create' }));
  await waitForNoModalDrawer(page);

  // Wait for env to begin creating
  await findElement(page, clickable({ textContains: 'JupyterLab Environment' }));
  await findElement(page, clickable({ textContains: 'Creating' }));

  // Wait for env to finish creating, or break early on only errors related to runtime creation
  const getErrorXPath = (text) => `//*[@role='alert' and contains(normalize-space(.),'${text}')]`;

  await Promise.race([
    findElement(page, clickable({ textContains: 'Running' }), { timeout: Millis.ofMinutes(25) }),
    findElement(page, getErrorXPath('Error Creating Cloud Environment'), { timeout: Millis.ofMinutes(25) }),
    findElement(page, getErrorXPath('Error modifying cloud environment'), { timeout: Millis.ofMinutes(25) }),
  ]);

  let hasRelevantError = false;
  try {
    await findElement(page, getErrorXPath('Error Creating Cloud Environment'), { timeout: Millis.ofSecond });
    hasRelevantError = true;
  } catch {}
  try {
    await findElement(page, getErrorXPath('Error modifying cloud environment'), { timeout: Millis.ofSecond });
    hasRelevantError = true;
  } catch {}

  if (hasRelevantError) {
    throw new Error('Failed to create cloud environment');
  }

  // Here, we dismiss any errors or popups. Its common another areas of the application might throw an error or have pop-ups.
  // However, as long as we have a running runtime (which the previous section asserts), the pop-up is not relevant
  await dismissAllNotifications(page);

  await click(page, clickable({ textContains: 'Open' }));

  // Find the iframe and wait until the Jupyter kernel is ready
  const frame = await findIframe(page, '//iframe[@title="Interactive JupyterLab iframe"]', {
    timeout: Millis.ofMinutes(2),
  });
  if (!frame) {
    throw new Error('iframe not found');
  }

  await findText(frame, 'Kernel status: Idle', { timeout: Millis.ofMinutes(5) });

  // Wait for stable UI (sometimes kernel status flickers and fillIn won't work)
  await delay(Millis.ofSeconds(10));
  // Run a command
  await fillIn(frame, '//*[contains(@class,"jp-Cell-inputArea")]', 'print(123456789099876543210990+9876543219)');
  await click(frame, '//button[starts-with(@title, "Run")]');
  await findText(frame, '123456789099886419754209');

  // Save notebook to avoid "unsaved changes" modal when test tear-down tries to close the window
  await click(frame, '//button[starts-with(@title, "Save")]');

  // Cleanup
  const workspaceId = await getWorkspaceId({ page, billingProject, workspaceName });
  await deleteRuntimesV2({ page, billingProject, workspaceId });
});

registerTest({
  name: 'run-analysis-azure',
  fn: testRunAnalysisAzure,
  // Test is disabled until we reprioritize Azure support
  targetEnvironments: [],
  timeout: Millis.ofMinutes(30),
});
