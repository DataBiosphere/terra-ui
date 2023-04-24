const _ = require("lodash/fp");
const { checkbox, click, clickable, clickTableCell, waitForNoSpinners } = require("../utils/integration-utils");
const { navigateToDataCatalog } = require("../utils/integration-helpers");
const { registerTest } = require("../utils/jest-utils");
const { withUserToken } = require("../utils/terra-sa-utils");

async function getHrefFromClickable(page, selector) {
  return (await (await page.waitForXPath(clickable(selector), _.defaults({ visible: true }))).getProperty("href")).jsonValue();
}

const dbGapUrlRoot = "https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=";

const testRequestAccessFn = withUserToken(async ({ testUrl, page, token }) => {
  await navigateToDataCatalog(page, testUrl, token);
  await click(page, checkbox({ text: "Controlled", isDescendant: true }));

  // Request access from the browse & explore page
  if (!_.includes(dbGapUrlRoot, await getHrefFromClickable(page, { textContains: "Request Access" }))) {
    throw new Error("Discoverable dataset did not have a dbGap href");
  }

  // Request access from the dataset details page
  await clickTableCell(page, {
    tableName: "dataset list",
    columnHeader: "Dataset Name",
    text: "Discoverable Catalog Snapshot 1",
    isDescendant: true,
  });
  await waitForNoSpinners(page);
  if (!_.includes(dbGapUrlRoot, await getHrefFromClickable(page, { textContains: "Request Access" }))) {
    throw new Error("Discoverable dataset did not have a dbGap href");
  }
});

registerTest({
  name: "request-access",
  fn: testRequestAccessFn,
  timeout: 2 * 60 * 1000, // 2 min timeout
});
