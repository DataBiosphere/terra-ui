const _ = require("lodash/fp");
const fetch = require("node-fetch");
const { withWorkspace } = require("../utils/integration-helpers");
const { click, clickable, findText, select, signIntoTerra } = require("../utils/integration-utils");
const { registerTest } = require("../utils/jest-utils");
const { withUserToken } = require("../utils/terra-sa-utils");

const testWorkflowIdentifier = "github.com/DataBiosphere/topmed-workflows/UM_variant_caller_wdl:1.31.0";

const withDockstoreCheck = (test) => async (options) => {
  const { testUrl } = options;
  const { dockstoreUrlRoot } = await fetch(`${testUrl}/config.json`).then((res) => res.json());
  const res = await fetch(`${dockstoreUrlRoot}/api/api/ga4gh/v1/metadata`);
  if (res.status === 200) {
    await test(options);
  } else {
    console.error("Skipping dockstore test, API appears to be down");
  }
};

const testImportDockstoreWorkflowFn = _.flow(
  withWorkspace,
  withUserToken,
  withDockstoreCheck
)(async ({ page, testUrl: testUrlRoot, token, workspaceName }) => {
  const testUrl = `${testUrlRoot}/#import-tool/dockstore/${testWorkflowIdentifier}`;
  await signIntoTerra(page, { token, testUrl });

  await findText(page, "workflow TopMedVariantCaller");
  await select(page, "Select a workspace", workspaceName);
  await click(page, clickable({ text: "Import" }));
  await findText(page, testWorkflowIdentifier);
});

registerTest({
  name: "import-dockstore-workflow",
  fn: testImportDockstoreWorkflowFn,
});
