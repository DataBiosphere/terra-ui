const { checkbox, click, clickable, findText, waitForNoSpinners, assertRowHas } = require("../utils/integration-utils");
const { navigateToDataCatalog } = require("../utils/integration-helpers");
const { registerTest } = require("../utils/jest-utils");
const { withUserToken } = require("../utils/terra-sa-utils");

const datasetName = "Readable Catalog Snapshot 1";

const testPreviewDatasetFn = withUserToken(async ({ testUrl, page, token }) => {
  await navigateToDataCatalog(page, testUrl, token);
  await click(page, checkbox({ text: "Granted", isDescendant: true }));
  await click(page, clickable({ textContains: `${datasetName}` }));
  await waitForNoSpinners(page);
  await findText(page, "Contributors");
  await click(page, clickable({ textContains: "Preview data" }));
  await waitForNoSpinners(page);

  const tableName = "Participant Preview Data";
  await assertRowHas(page, {
    tableName,
    expectedColumnValues: [
      ["age", 36],
      ["biological_sex", "male"],
    ],
    withKey: { column: "participant_id", text: "participant1" },
  });
});

registerTest({
  name: "preview-dataset",
  fn: testPreviewDatasetFn,
  timeout: 2 * 60 * 1000,
});
