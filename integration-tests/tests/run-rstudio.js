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
  dismissAllNotifications,
  fillIn,
  findElement,
  findIframe,
  findText,
  getAnimatedDrawer,
  input,
  noSpinnersAfter,
  waitForNoModal,
  waitForNoSpinners,
} = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const rFileName = `test-rmd-${uuid.v4()}`;

const testRunRStudioFn = _.flowRight(
  withUserToken,
  withWorkspace
)(async ({ billingProject, workspaceName, page, testUrl, token }) => {
  await gotoAnalysisTab(page, token, testUrl, workspaceName);

  // Create analysis file
  await click(page, clickable({ textContains: 'Start' }));
  await findElement(page, getAnimatedDrawer('Select an application'), { timeout: Millis.ofMinute });
  await click(page, clickable({ text: 'Create new R file', isDescendant: true }));
  await fillIn(page, input({ placeholder: 'Enter a name' }), rFileName);
  await noSpinnersAfter(page, {
    action: () =>
      click(page, clickable({ text: 'Create Analysis' }), {
        timeout: Millis.ofMinute,
      }),
    timeout: Millis.ofMinute,
  });

  // Close the create cloud env modal that pops up
  // TODO [IA-4726] fix transition from create-analysis to cloud-environment modal
  await noSpinnersAfter(page, {
    action: () => findText(page, 'RStudio Cloud Environment'),
    timeout: Millis.ofMinute,
  });
  await click(page, clickable({ textContains: 'Close' }), { timeout: Millis.ofMinute });
  await waitForNoModal(page);

  // Navigate to analysis launcher
  await click(page, clickable({ textContains: `${rFileName}.Rmd` }));
  await dismissInfoNotifications(page);
  await findText(page, 'PREVIEW (READ-ONLY)');
  await waitForNoSpinners(page);

  // Attempt to open analysis; create a cloud env
  await noSpinnersAfter(page, {
    action: () => click(page, clickable({ textContains: 'Open' })),
  });
  await click(page, clickable({ text: 'Create' }));
  await waitForNoModal(page);

  // Wait for env to begin creating
  await findElement(page, clickable({ textContains: 'RStudio Environment' }), { timeout: Millis.ofMinutes(2) });
  await findElement(page, clickable({ textContains: 'Creating' }), { timeout: Millis.ofSeconds(40) });

  // Wait for env to finish creating
  await findElement(page, clickable({ textContains: 'Running' }), { timeout: Millis.ofMinutes(12) });

  // Here, we dismiss any errors or popups. Its common another areas of the application might throw an error or have pop-ups.
  // However, as long as we have a running runtime (which the previous section asserts), the pop-up is not relevant
  await dismissAllNotifications(page);

  await click(page, clickable({ textContains: 'Open' }));

  // Find the iframe, wait until the RStudio iframe is loaded, and execute some code
  const frame = await findIframe(page, '//iframe[@title="Interactive RStudio iframe"]', { timeout: Millis.ofMinutes(2) });
  if (!frame) {
    throw new Error('iframe not found');
  }

  await findElement(frame, '//*[@id="rstudio_container"]', { timeout: Millis.ofMinutes(2) });

  // Wait for stable UI (sometimes kernel status flickers and fillIn won't work)
  await delay(Millis.ofSeconds(3));
  await fillIn(frame, '//textarea', 'x=1;x');
  await page.keyboard.press('Enter');
  await findText(frame, '[1] 1');

  await dismissInfoNotifications(page);

  await deleteRuntimes({ page, billingProject, workspaceName });
});

registerTest({
  name: 'run-rstudio',
  fn: testRunRStudioFn,
  timeout: Millis.ofMinutes(14),
});
