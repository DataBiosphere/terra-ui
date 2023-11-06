const _ = require('lodash/fp');
const uuid = require('uuid');
const {
  click,
  clickable,
  dismissNotifications,
  fillIn,
  findText,
  gotoPage,
  input,
  label,
  signIntoTerra,
  waitForNoSpinners,
  navChild,
  noSpinnersAfter,
  navOptionNetworkIdle,
  enablePageLogging,
} = require('./integration-utils');
const { fetchLyle } = require('./lyle-utils');

const defaultTimeout = 5 * 60 * 1000;

const withSignedInPage = (fn) => async (options) => {
  const { context, testUrl, token } = options;
  const page = await context.newPage();
  enablePageLogging(page);
  try {
    await signIntoTerra(page, { token, testUrl });
    return await fn({ ...options, page });
  } finally {
    await page.close();
  }
};

const clipToken = (str) => str.toString().substr(-10, 10);

const testWorkspaceNamePrefix = 'terra-ui-test-workspace-';
const getTestWorkspaceName = () => `${testWorkspaceNamePrefix}${uuid.v4()}`;

/**
 * GCP IAM changes may take a few minutes to propagate after creating a workspace or granting a
 * user access to a workspace. This function polls to check if the logged in user's pet service
 * account has read access to the given workspace's GCS bucket.
 */
const waitForAccessToWorkspaceBucket = async ({ page, billingProject, workspaceName, timeout = defaultTimeout }) => {
  await page.evaluate(
    async ({ billingProject, workspaceName, timeout }) => {
      const {
        workspace: { googleProject, bucketName },
      } = await window.Ajax().Workspaces.workspace(billingProject, workspaceName).details(['workspace', 'azureContext']);

      const startTime = Date.now();

      const checks = [
        // Get bucket metadata
        () => window.Ajax().Buckets.checkBucketLocation(googleProject, bucketName),
        // https://rawls.dsde-dev.broadinstitute.org/#/workspaces/readBucket
        // Checks if user has bucket access, 403 if not.
        // This API checks if user has all expected permissions. `read` on API name does not accurately describe APIs functionality.
        () => window.Ajax().Workspaces.workspace(billingProject, workspaceName).checkBucketReadAccess(),
      ];

      for (const check of checks) {
        while (true) {
          try {
            await check();
            break;
          } catch (response) {
            if (response.status === 403) {
              if (Date.now() - startTime < timeout) {
                // Wait 15s before retrying
                await new Promise((resolve) => setTimeout(resolve, 15 * 1000));
                continue;
              } else {
                throw new Error('Timed out waiting for access to workspace bucket');
              }
            } else {
              throw response;
            }
          }
        }
      }
    },
    { billingProject, workspaceName, timeout }
  );
};

const makeWorkspace = withSignedInPage(async ({ page, billingProject }) => {
  const workspaceName = getTestWorkspaceName();
  try {
    await page.evaluate(
      async (name, billingProject) => {
        await window.Ajax().Workspaces.create({ namespace: billingProject, name, attributes: {} });
      },
      workspaceName,
      billingProject
    );
    console.info(`Created workspace: ${workspaceName}`);
  } catch (e) {
    console.error(`Failed to create workspace: ${workspaceName} with billing project: ${billingProject}`);
    console.error(e);
    throw e;
  }
  return { page, billingProject, workspaceName };
});

const waitForAccess = async ({ page, billingProject, workspaceName }) => {
  await waitForAccessToWorkspaceBucket();
  return { page, billingProject, workspaceName };
};

const makeWorkspaceGcp = _.flow(makeWorkspace, waitForAccess);

const deleteWorkspace = withSignedInPage(async ({ page, billingProject, workspaceName }) => {
  try {
    await page.evaluate(
      async (name, billingProject) => {
        await window.Ajax().Workspaces.workspace(billingProject, name).delete();
      },
      workspaceName,
      billingProject
    );
    console.info(`Deleted workspace: ${workspaceName}`);
  } catch (e) {
    console.error(`Failed to delete workspace: ${workspaceName} with billing project: ${billingProject}`);
    console.error(e);
    throw e;
  }
});

const deleteWorkspaceV2 = withSignedInPage(async ({ page, billingProject, workspaceName }) => {
  try {
    await page.evaluate(
      async (name, billingProject) => {
        await window.Ajax().Workspaces.workspaceV2(billingProject, name).delete();
      },
      workspaceName,
      billingProject
    );
    console.info(`Deleted workspace: ${workspaceName}`);
  } catch (e) {
    console.error(`Failed to delete workspace: ${workspaceName} with billing project: ${billingProject}`);
    console.error(e);
    throw e;
  }
});

const withWorkspace = (test) => async (options) => {
  console.log('withWorkspace ...');
  const { workspaceName } = await makeWorkspaceGcp(options);

  try {
    await test({ ...options, workspaceName });
  } finally {
    console.log('withWorkspace cleanup ...');
    await deleteWorkspace({ ...options, workspaceName });
  }
};

const withWorkspaceAzure = (test) => async (options) => {
  console.log('withWorkspaceAzure ...');
  options = {
    ...options,
    billingProject: options.billingProjectAzure,
  };
  const { workspaceName } = await makeWorkspace(options);
  console.log(`withWorkspaceAzure made workspace ${workspaceName}`);

  try {
    await test({ ...options, workspaceName });
  } finally {
    console.log('withWorkspaceAzure cleanup ...', options, workspaceName);
    await deleteWorkspaceV2({ ...options, workspaceName });
  }
};

const createEntityInWorkspace = (page, billingProject, workspaceName, testEntity) => {
  return page.evaluate(
    (billingProject, workspaceName, testEntity) => {
      return window.Ajax().Workspaces.workspace(billingProject, workspaceName).createEntity(testEntity);
    },
    billingProject,
    workspaceName,
    testEntity
  );
};

const makeUser = async () => {
  const { email } = await fetchLyle('create');
  const { accessToken: token } = await fetchLyle('token', email);
  console.info(`created a user "${email}" with token: ...${clipToken(token)}`);
  return { email, token };
};

const withUser = (test) => async (args) => {
  console.log('withUser ...');
  const { email, token } = await makeUser();

  try {
    await test({ ...args, email, token });
  } finally {
    console.log('withUser cleanup ...');
    await fetchLyle('delete', email);
  }
};

const deleteRuntimes = async ({ page, billingProject, workspaceName }) => {
  const deletedRuntimes = await page.evaluate(
    async (billingProject, workspaceName) => {
      const {
        workspace: { googleProject },
      } = await window.Ajax().Workspaces.workspace(billingProject, workspaceName).details(['workspace']);
      const runtimes = await window.Ajax().Runtimes.list({ googleProject, role: 'creator' });
      return Promise.all(
        _.map(async (runtime) => {
          await window.Ajax().Runtimes.runtime(runtime.googleProject, runtime.runtimeName).delete(true); // true = also delete persistent disk.
          return runtime.runtimeName;
        }, _.remove({ status: 'Deleting' }, runtimes))
      );
    },
    billingProject,
    workspaceName
  );
  console.info(`deleted runtimes: ${deletedRuntimes}`);
};

const deleteRuntimesV2 = async ({ page, billingProject, workspaceName }) => {
  const deletedRuntimes = await page.evaluate(
    async (workspaceName) => {
      const {
        workspace: { workspaceId },
      } = await window.Ajax().Workspaces.workspace(billingProject, workspaceName).details(['workspace.workspaceId']);
      const runtimes = await window.Ajax().Runtimes.listV2WithWorkspace(workspaceId, { role: 'creator' });
      return Promise.all(
        _.map(async (runtime) => {
          await window.Ajax().Runtimes.runtimeV2(runtime.workspaceId, runtime.runtimeName).delete(true); // true = also delete persistent disk.
          return runtime.runtimeName;
        }, _.remove({ status: 'Deleting' }, runtimes))
      );
    },
    billingProject,
    workspaceName
  );
  console.info(`deleted v2 runtimes: ${deletedRuntimes}`);
};

const deleteAppsV2 = async ({ page, billingProject, workspaceName }) => {
  const deletedApps = await page.evaluate(
    async (workspaceName) => {
      const {
        workspace: { workspaceId },
      } = await window.Ajax().Workspaces.workspace(billingProject, workspaceName).details(['workspace.workspaceId']);
      const apps = await window.Ajax().Apps.listAppsV2(workspaceId);
      return Promise.all(
        _.map(async (app) => {
          await window.Ajax().Apps.app(app.cloudContext.cloudResource, app.appName).delete();
          return app.appName;
        }, _.remove({ status: 'Deleting' }, apps))
      );
    },
    billingProject,
    workspaceName
  );
  console.info(`deleted v2 apps: ${deletedApps}`);
};

const navigateToDataCatalog = async (page, testUrl, token) => {
  await gotoPage(page, testUrl);
  await waitForNoSpinners(page);
  await findText(page, 'Browse Data');
  await click(page, clickable({ textContains: 'Browse Data' }));
  await signIntoTerra(page, { token });
  await enableDataCatalog(page);
};

const enableDataCatalog = async (page) => {
  await click(page, clickable({ textContains: 'datasets' }));
  await click(page, label({ labelContains: 'New Catalog OFF' }));
  await waitForNoSpinners(page);
};

const clickNavChildAndLoad = async (page, tab) => {
  // click triggers a page navigation event
  await Promise.all([page.waitForNavigation(navOptionNetworkIdle()), noSpinnersAfter(page, { action: () => click(page, navChild(tab)) })]);
};

const viewWorkspaceDashboard = async (page, token, workspaceName) => {
  // Sign in to handle unexpected NPS survey popup and "Loading Terra..." spinner
  await signIntoTerra(page, { token });
  await click(page, clickable({ textContains: 'View Workspaces' }));
  await dismissNotifications(page);
  await fillIn(page, input({ placeholder: 'Search by keyword' }), workspaceName);
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: workspaceName })) });
};

const performAnalysisTabSetup = async (page, token, testUrl, workspaceName) => {
  await gotoPage(page, testUrl);
  await findText(page, 'View Workspaces');
  await viewWorkspaceDashboard(page, token, workspaceName);
  await clickNavChildAndLoad(page, 'analyses');
  await dismissNotifications(page);
};

module.exports = {
  clickNavChildAndLoad,
  createEntityInWorkspace,
  defaultTimeout,
  deleteAppsV2,
  deleteRuntimes,
  deleteRuntimesV2,
  navigateToDataCatalog,
  enableDataCatalog,
  testWorkspaceNamePrefix,
  testWorkspaceName: getTestWorkspaceName,
  withWorkspace,
  withWorkspaceAzure,
  withUser,
  performAnalysisTabSetup,
  viewWorkspaceDashboard,
};
