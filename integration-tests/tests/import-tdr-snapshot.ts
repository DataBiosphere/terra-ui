const _ = require('lodash/fp');
const qs = require('qs');

const { withProtectedWorkspace } = require('../utils/integration-helpers');
const {
  click,
  clickable,
  dismissInfoNotifications,
  findText,
  navChild,
  select,
  signIntoTerra,
  waitForNoSpinners,
} = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const importTdrSnapshot = _.flow(
  withProtectedWorkspace,
  withUserToken
)(async ({ page, tdrSnapshot, testUrl, token, workspaceName }) => {
  // Navigate to import page
  const importUrl = `${testUrl}/#import-data?${qs.stringify({
    format: 'tdrexport',
    snapshotId: tdrSnapshot.id,
    snapshotName: tdrSnapshot.name,
    tdrmanifest: tdrSnapshot.manifestUrl,
    tdrSyncPermissions: false,
    url: tdrSnapshot.tdrUrl,
  })}`;
  await signIntoTerra(page, { token, testUrl: importUrl });

  // Select workspace
  await click(page, clickable({ textContains: 'Select an existing workspace' }));
  await select(page, 'Select a workspace', workspaceName);

  // Import
  await click(page, clickable({ text: 'Import' }));
  await waitForNoSpinners(page);

  // Wait for import to complete
  await findText(page, 'Data import in progress');
  await findText(page, 'Data imported successfully', { timeout: 180000 });
  await dismissInfoNotifications(page);

  // Refresh data tab
  await click(page, navChild('data'));
  await waitForNoSpinners(page);

  // Assert data is present
  await findText(page, 'things (3 rows)');

  // Go to workspace dashboard
  await click(page, navChild('dashboard'));
  await waitForNoSpinners(page);

  // Assert policy has propagated from snapshot to workspace
  await findText(page, 'Data Access ControlsYes');
  await click(page, clickable({ text: 'Authorization domain' }));
  await findText(page, tdrSnapshot.groupConstraint);
});

registerTest({
  name: 'import-tdr-snapshot',
  fn: importTdrSnapshot,
});
