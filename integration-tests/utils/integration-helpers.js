const _ = require('lodash/fp');
const uuid = require('uuid');
const {
  Millis,
  click,
  clickable,
  delay,
  dismissErrorNotifications,
  dismissNotifications,
  enablePageLogging,
  fillIn,
  findElement,
  findText,
  gotoPage,
  input,
  label,
  navChild,
  navOptionNetworkIdle,
  noSpinnersAfter,
  retryUntil,
  signIntoTerra,
  waitForNoSpinners,
} = require('./integration-utils');
const { fetchLyle } = require('./lyle-utils');

/** Long timeout for bucket propagation and full test runs. */
const defaultTimeout = Millis.ofMinutes(5);

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
      console.info('waitForAccessToWorkspaceBucket ...');
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

const makeWorkspace = withSignedInPage(async ({ page, billingProject, hasBucket = false }) => {
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
    if (hasBucket) {
      await waitForAccessToWorkspaceBucket({ page, billingProject, workspaceName });
    }
  } catch (e) {
    console.error(`Failed to create workspace: ${workspaceName} with billing project: ${billingProject}`);
    console.error(e);
    throw e;
  }
  return { page, billingProject, workspaceName };
});

const makeGcpWorkspace = async (options) => {
  return await makeWorkspace({ ...options, hasBucket: true });
};

const deleteWorkspaceInUi = async ({ page, billingProject, testUrl, workspaceName, retries = 5 }) => {
  gotoPage(page, `${testUrl}#workspaces/${billingProject}/${workspaceName}`);
  const isDeleted = await retryUntil({
    getResult: async () => {
      await findElement(page, clickable({ labelContains: 'Action Menu' }, { timeout: Millis.ofMinutes(2) }));
      await click(page, clickable({ labelContains: 'Action Menu' }));
      await noSpinnersAfter(page, {
        action: () => click(page, clickable({ textContains: 'Delete' })),
      });
      try {
        await findText(page, "Please type 'Delete Workspace' to continue:");
        return true;
      } catch (e) {
        await click(page, clickable({ textContains: 'Cancel' }));
        return false;
      }
    },
    interval: Millis.ofSeconds(30),
    leading: true,
    retries,
  });
  if (!isDeleted) {
    return isDeleted;
  }
  await fillIn(page, input({ placeholder: 'Delete Workspace' }), 'Delete Workspace');
  await noSpinnersAfter(page, {
    action: () => click(page, clickable({ textContains: 'Delete workspace' })),
    timeout: Millis.ofMinutes(2),
  });
  return true;
};

const deleteWorkspaceV2 = async ({ page, billingProject, workspaceName }) => {
  try {
    const isAppsEmpty = await deleteAppsV2({ page, billingProject, workspaceName });
    const isRuntimesEmpty = await deleteRuntimesV2({ page, billingProject, workspaceName });
    if (isAppsEmpty && isRuntimesEmpty) {
      // TODO [IA-4337] fix disk delete as part of runtime delete
      await page.evaluate(
        async (workspaceName, billingProject) => {
          try {
            await window.Ajax().Workspaces.workspaceV2(billingProject, workspaceName).delete();
          } catch (error) {
            if (error.status === 404) {
              console.info(`Not found: workspace ${workspaceName} with billing project ${billingProject}. Was it already deleted?`);
            } else {
              throw error;
            }
          }
        },
        workspaceName,
        billingProject
      );
    } else {
      console.warn(`Workspace not deletable: ${workspaceName} with billing project: ${billingProject} has undeletable child resources`);
      return false;
    }
  } catch (e) {
    console.error(`Failed to delete workspace: ${workspaceName} with billing project: ${billingProject}`);
    console.error(e);
    return false;
  }
  console.info(`Deleted workspace: ${workspaceName}`);
  return true;
};

/** Create a GCP workspace, run the given test, then delete the workspace. */
const withWorkspace = (test) => async (options) => {
  console.log('withWorkspace ...');
  const { workspaceName } = await makeGcpWorkspace(options);

  try {
    await test({ ...options, workspaceName });
  } finally {
    console.log('withWorkspace cleanup ...');
    const didDelete = await deleteWorkspaceInUi({ ...options, workspaceName });
    if (!didDelete) {
      // Pass test on a failed cleanup - expect leaked resources to be cleaned up by the test `delete-orphaned-workspaces`
      console.error(`Unable to delete workspace ${workspaceName} via the UI. The resource will be leaked!`);
    }
  }
};

/** Create an Azure workspace, run the given test, then delete the workspace. */
const withAzureWorkspace = (test) => async (options) => {
  console.log('withAzureWorkspace ...');
  options = {
    ...options,
    billingProject: options.billingProjectAzure,
  };
  const { workspaceName } = await makeWorkspace(options);
  console.log(`withAzureWorkspace made workspace ${workspaceName}`);

  try {
    await test({ ...options, workspaceName });
  } finally {
    console.log('withAzureWorkspace cleanup ...');
    // Retry for a long time (20 retries * 30 second intervals ~= 8 minutes);
    // leaked resources can impact all other integration tests which share a user,
    // and Azure VMs spend a long time in CREATING (an undeletable state)
    const didDelete = await deleteWorkspaceInUi({ ...options, workspaceName, retries: 20 });
    if (!didDelete) {
      // Pass test on a failed cleanup - expect leaked resources to be cleaned up by the test `delete-orphaned-workspaces`
      console.error(`Unable to delete workspace ${workspaceName} via the UI. The resource will be leaked!`);
    }
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

const getWorkspaceId = async ({ page, billingProject, workspaceName }) =>
  await page.evaluate(
    async (billingProject, workspaceName) => {
      const {
        workspace: { workspaceId },
      } = await window.Ajax().Workspaces.workspace(billingProject, workspaceName).details(['workspace.workspaceId']);
      return workspaceId;
    },
    billingProject,
    workspaceName
  );

/** Deletes all v2 apps in a workspace. Returns true if all deletes succeed. */
const deleteAppsV2 = async ({ page, billingProject, workspaceName }) => {
  const workspaceId = await getWorkspaceId({ page, billingProject, workspaceName });
  const deletableApps = await page.evaluate(async (workspaceId) => {
    const apps = await window.Ajax().Apps.listAppsV2(workspaceId);
    return apps;
  }, workspaceId);
  const deletedApps = await Promise.all(
    deletableApps.map(async (app) => {
      const isAppDeleted = await patientlyDeleteApp(page, app);
      return {
        name: app.appName,
        isDeleted: isAppDeleted,
      };
    })
  );
  const deletedAppsLog = deletedApps
    .map(({ name, isDeleted }) => {
      const appLog = isDeleted ? name : `FAILED:${name}`;
      return appLog;
    })
    .join(', ');
  if (deletedAppsLog) {
    console.info(`Delete v2 apps in ${billingProject}/${workspaceName} complete: ${deletedAppsLog}`);
  }
  return deletedApps.every((app) => app.isDeleted);
};

/** Deletes all v1 runtimes in a workspace, and their disks. */
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

/** Deletes all v2 runtimes in a workspace, and their disks. Returns true if all deletes succeed. */
const deleteRuntimesV2 = async ({ page, billingProject, workspaceName }) => {
  const workspaceId = await getWorkspaceId({ page, billingProject, workspaceName });
  const deletableRuntimes = await page.evaluate(async (workspaceId) => {
    return await window.Ajax().Runtimes.listV2WithWorkspace(workspaceId, { role: 'creator' });
  }, workspaceId);
  const deletedRuntimes = await Promise.all(
    deletableRuntimes.map(async (runtime) => {
      const isRuntimeDeleted = await patientlyDeleteRuntime(page, runtime);
      return {
        name: runtime.runtimeName,
        isDeleted: isRuntimeDeleted,
      };
    })
  );
  const deletedRuntimesLog = deletedRuntimes.map(({ name, isDeleted }) => (isDeleted ? name : `FAILED:${name}`)).join(', ');
  if (deletedRuntimesLog) {
    console.info(`Delete v2 runtimes in ${billingProject}/${workspaceName} complete: ${deletedRuntimesLog}`);
  }
  return deletedRuntimes.every((runtime) => runtime.isDeleted);
};

/**
 * Delete a v2 app, returning `true` when deletion is complete.
 * Will return `false` if app is not deletable.
 */
const patientlyDeleteApp = async (page, { workspaceId, appName, status }) => {
  const isDeletable = isResourceDeletable('app', status);
  if (!isDeletable) {
    console.error(`Cannot delete app ${appName} in workspace ${workspaceId} with status ${status}. Try deleting it manually.`);
    return false;
  }

  await page.evaluate(
    async (workspaceId, appName) => {
      await window.Ajax().Apps.deleteAppV2(appName, workspaceId, { deleteDisk: true });
    },
    workspaceId,
    appName
  );

  const newStatus = await retryUntil({
    getResult: async () =>
      await page.evaluate(
        async (workspaceId, appName) => {
          try {
            const appState = await window.Ajax().Apps.getAppV2(appName, workspaceId);
            const lowStatus = appState.status?.toLowerCase();
            return lowStatus !== 'deleting' && lowStatus;
          } catch (response) {
            if (response.status === 404) {
              return 'deleted';
            }
            throw response;
          }
        },
        workspaceId,
        appName
      ),
    interval: Millis.ofSeconds(20),
    retries: 10,
  });

  if (newStatus === 'deleted') {
    console.log(`deleted app: ${appName}`);
    return true;
  }
  if (newStatus) {
    console.error(`delete app ${appName} failed: was in ${status.toLowerCase()}, now in ${newStatus}`);
  } else {
    console.error(`delete app ${appName} failed: timed out`);
  }
  return false;
};

/**
 * Delete a v2 runtime, returning `true` when deletion is complete. Deletes the associated disk.
 * Will return `false` if runtime or disk is not deletable.
 */
const patientlyDeleteRuntime = async (page, { workspaceId, runtimeName, status }) => {
  // TODO [IA-4337] fix disk delete as part of runtime delete
  const isDeletable = isResourceDeletable('runtime', status);
  if (!isDeletable) {
    console.error(`Cannot delete runtime ${runtimeName} in workspace ${workspaceId} with status ${status}. Try deleting it manually.`);
    return false;
  }

  await page.evaluate(
    async (workspaceId, runtimeName) => {
      const runtimeApi = window.Ajax().Runtimes.runtimeV2(workspaceId, runtimeName);
      const willDeleteDisk = true;
      await runtimeApi.delete(willDeleteDisk);
    },
    workspaceId,
    runtimeName
  );

  const newStatus = await retryUntil({
    getResult: async () =>
      await page.evaluate(
        async (workspaceId, runtimeName) => {
          try {
            const runtimeApi = window.Ajax().Runtimes.runtimeV2(workspaceId, runtimeName);
            const runtimeState = await runtimeApi.details();
            const lowStatus = runtimeState.status?.toLowerCase();
            return lowStatus !== 'deleting' && lowStatus;
          } catch (response) {
            if (response.status === 404) {
              return 'deleted';
            }
            throw response;
          }
        },
        workspaceId,
        runtimeName
      ),
    interval: Millis.ofSeconds(20),
    retries: 10,
  });

  if (newStatus === 'deleted') {
    console.log(`deleted runtime: ${runtimeName}`);
    return true;
  }
  if (newStatus) {
    console.error(`delete runtime ${runtimeName} failed: was in ${status.toLowerCase()}, now in ${newStatus}`);
  } else {
    console.error(`delete runtime ${runtimeName} failed: timed out`);
  }
  return false;
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
  await Promise.all([
    page.waitForNavigation(navOptionNetworkIdle()),
    noSpinnersAfter(page, {
      action: () => click(page, navChild(tab)),
      timeout: Millis.ofMinute,
      debugMessage: `clickNavChildAndLoad ${tab}`,
    }),
  ]);
};

const viewWorkspaceDashboard = async (page, token, workspaceName) => {
  // Sign in to handle unexpected NPS survey popup and "Loading Terra..." spinner
  await signIntoTerra(page, { token });
  await click(page, clickable({ textContains: 'View Workspaces' }));
  await dismissNotifications(page);
  await fillIn(page, input({ placeholder: 'Search by keyword' }), workspaceName);
  // Wait for workspace table to rerender filtered items
  await delay(Millis.of(300));
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: workspaceName })) });
};

const gotoAnalysisTab = async (page, token, testUrl, workspaceName) => {
  await gotoPage(page, testUrl);
  await findText(page, 'View Workspaces');
  await viewWorkspaceDashboard(page, token, workspaceName);

  // TODO [https://broadinstitute.slack.com/archives/C03GMG4DUSE/p1699467686195939] resolve NIH link error issues.
  // For now, dismiss error popups in the workspaces context as irrelevant to Analyses tests.
  await dismissErrorNotifications(page);

  await clickNavChildAndLoad(page, 'analyses');

  await findText(page, 'Your Analyses');
  await dismissNotifications(page);
};

// See src/analysis/utils/resource-utils.ts
const isResourceDeletable = (resourceType, status) =>
  ((lowStatus) => {
    switch (resourceType) {
      case 'runtime':
        return ['unknown', 'running', 'updating', 'error', 'stopping', 'stopped', 'starting'].includes(lowStatus);
      case 'app':
        return ['unspecified', 'running', 'error'].includes(lowStatus);
      case 'disk':
        return ['failed', 'ready'].includes(lowStatus);
      default:
        console.error(`Cannot determine deletability; resource type ${resourceType} must be one of runtime, app or disk.`);
        return undefined;
    }
  })(_.lowerCase(status));

module.exports = {
  clickNavChildAndLoad,
  createEntityInWorkspace,
  defaultTimeout,
  deleteRuntimes,
  deleteRuntimesV2,
  deleteWorkspaceV2,
  enableDataCatalog,
  gotoAnalysisTab,
  navigateToDataCatalog,
  testWorkspaceName: getTestWorkspaceName,
  testWorkspaceNamePrefix,
  viewWorkspaceDashboard,
  withAzureWorkspace,
  withUser,
  withWorkspace,
};
