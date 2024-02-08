const _ = require('lodash/fp');
const { withWorkspace } = require('../utils/integration-helpers');
const { testExportToWorkspace } = require('../utils/catalog-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const exportTdrDatasetToWorkspace = _.flow(
  withWorkspace,
  withUserToken
)(async ({ billingProject, page, testUrl, token, workspaceName }) => {
  await testExportToWorkspace(billingProject, page, testUrl, token, 'Readable Catalog Snapshot 1', workspaceName);
});

registerTest({
  name: 'export-tdr-dataset-to-workspace',
  fn: exportTdrDatasetToWorkspace,
  timeout: 2 * 60 * 1000,
  // Tests are disabled until we reprioritize catalog support. See:
  // https://broadworkbench.atlassian.net/browse/DC-810
  targetEnvironments: [],
});
