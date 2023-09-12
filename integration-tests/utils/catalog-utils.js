const { navigateToDataCatalog } = require('./integration-helpers');
const { click, clickable, checkbox, clickTableCell, noSpinnersAfter, waitForNoSpinners, select, findText } = require('./integration-utils');

const eitherThrow = (testFailure, { cleanupFailure, cleanupMessage }) => {
  if (testFailure) {
    cleanupFailure && console.error(`${cleanupMessage}: ${cleanupFailure.message}`);
    throw testFailure;
  } else if (cleanupFailure) {
    throw new Error(`${cleanupMessage}: ${cleanupFailure.message}`);
  }
};

const linkDataToWorkspace = async (page, testUrl, token, datasetName) => {
  await navigateToDataCatalog(page, testUrl, token);
  await click(page, checkbox({ text: 'Granted', isDescendant: true }));
  // TODO: add test data with granted access DC-321
  await clickTableCell(page, { tableName: 'dataset list', columnHeader: 'Dataset Name', text: datasetName, isDescendant: true });
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Prepare for analysis' })) });
};

const testExportToWorkspace = async (billingProject, page, testUrl, token, datasetName, workspaceName) => {
  await linkDataToWorkspace(page, testUrl, token, datasetName);
  await waitForNoSpinners(page);
  await click(page, clickable({ textContains: 'Start with an existing workspace' }));
  await select(page, 'Select a workspace', `${workspaceName}`);
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Import' })) });
  await findText(page, `${billingProject}/${workspaceName}`);
  await findText(page, 'Select a data type');
};

module.exports = { eitherThrow, linkDataToWorkspace, testExportToWorkspace };
