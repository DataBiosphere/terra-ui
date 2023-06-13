// This test is owned by the Workspaces Team.
const _ = require('lodash/fp');
const { viewWorkspaceDashboard, withWorkspace } = require('../utils/integration-helpers');
const { assertNavChildNotFound, click, clickable, findText, gotoPage, navChild, verifyAccessibility } = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const workspaceDashboardPage = (testPage, token, workspaceName) => {
  return {
    visit: async () => {
      await viewWorkspaceDashboard(testPage, token, workspaceName);
    },

    assertDescription: async (expectedDescription) => {
      await findText(testPage, expectedDescription);
    },

    assertCloudInformation: async (expectedTextItems) => {
      await click(testPage, clickable({ text: 'Cloud information' }));
      await Promise.all(_.map(async (item) => await findText(testPage, item), expectedTextItems));
    },

    assertTabs: async (expectedTabs, enabled) => {
      await Promise.all(
        _.map(async (tab) => {
          await (enabled ? testPage.waitForXPath(navChild(tab)) : assertNavChildNotFound(testPage, tab));
        }, expectedTabs)
      );
    },
  };
};

const setGcpAjaxMockValues = async (testPage, namespace, name) => {
  return await testPage.evaluate(
    (namespace, name) => {
      const storageCostEstimateUrl = new RegExp(`api/workspaces/${namespace}/${name}/storageCostEstimate(.*)`, 'g');

      window.ajaxOverridesStore.set([
        {
          filter: { url: storageCostEstimateUrl },
          fn: window.ajaxOverrideUtils.makeSuccess({ estimate: 'Fake Estimate', lastUpdated: Date.now() }),
        },
        {
          filter: { url: /storage\/v1\/b(.*)/ }, // Bucket location response
          fn: window.ajaxOverrideUtils.makeSuccess({}),
        },
      ]);
    },
    namespace,
    name
  );
};

const testGoogleWorkspace = _.flow(
  withWorkspace,
  withUserToken
)(async ({ page, token, testUrl, billingProject, workspaceName }) => {
  await gotoPage(page, testUrl);
  await setGcpAjaxMockValues(page, billingProject, workspaceName);
  const dashboard = workspaceDashboardPage(page, token, workspaceName);
  await dashboard.visit();
  await dashboard.assertDescription('About the workspace');

  // Check selected items in cloud information
  const currentDate = new Date().toLocaleDateString();
  await dashboard.assertCloudInformation(['Cloud NameGoogle Cloud Platform', `Bucket SizeUpdated on ${currentDate}0 B`]);

  // Verify expected tabs are present.
  await dashboard.assertTabs(['data', 'analyses', 'workflows', 'job history'], true);

  // Check accessibility.
  await verifyAccessibility(page);
});

registerTest({
  name: 'google-workspace',
  fn: testGoogleWorkspace,
});
