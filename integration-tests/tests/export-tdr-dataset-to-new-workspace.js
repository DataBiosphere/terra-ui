const { registerTest } = require("../utils/jest-utils");
const { withUserToken } = require("../utils/terra-sa-utils");
const { testExportToNewWorkspace } = require("../utils/catalog-utils");

const exportTdrDatasetToNewWorkspace = withUserToken(async ({ billingProject, page, testUrl, token }) => {
  await testExportToNewWorkspace(billingProject, page, testUrl, token, "Readable Catalog Snapshot 1");
});

registerTest({
  name: "export-tdr-dataset-to-new-workspace",
  fn: exportTdrDatasetToNewWorkspace,
  timeout: 2 * 60 * 1000,
});
