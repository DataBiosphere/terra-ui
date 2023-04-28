const { registerTest } = require("../utils/jest-utils");
const { withUserToken } = require("../utils/terra-sa-utils");
const { testExportToNewWorkspace } = require("../utils/catalog-utils");

const exportWorkspaceDatasetToNewWorkspace = withUserToken(async ({ billingProject, page, testUrl, token }) => {
  await testExportToNewWorkspace(billingProject, page, testUrl, token, "Readable Catalog Workspace 1");
});

registerTest({
  name: "export-workspace-dataset-to-new-workspace",
  fn: exportWorkspaceDatasetToNewWorkspace,
  timeout: 2 * 60 * 1000,
});
