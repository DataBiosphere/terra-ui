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
  findText,
  gotoPage,
  input,
  label,
  navChild,
  navOptionNetworkIdle,
  noSpinnersAfter,
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

/* TODO
const deleteWorkspaceInUi = async ({ page, testUrl, token, workspaceName }) => {
  await gotoPage(page, testUrl);
  await findText(page, 'View Workspaces');
  await viewWorkspaceDashboard(page, token, workspaceName);
  await findText(page, clickable({ textContains: 'Delete' }));
  await noSpinnersAfter(page, {
    action: () => click(page, clickable({ textContains: 'Delete' })),
    timeout: Millis.ofMinute,
    debugMessage: 'deleteWorkspaceInUi - opened delete',
  });
  await findText(page, "Please type 'Delete Workspace' to continue:");
  await fillIn(page, input({ placeholder: 'Delete Workspace' }), 'Delete Workspace');
  await noSpinnersAfter(page, {
    action: () => click(page, clickable({ textContains: 'Delete Workspace' })),
    timeout: Millis.ofMinutes(2),
    debugMessage: 'deleteWorkspaceInUi - submitted delete',
  });
};
*/

const deleteWorkspaceV2AsUser = async ({ page, billingProject, workspaceName }) => {
  try {
    const isAppsEmpty = await deleteAppsV2({ page, billingProject, workspaceName });
    const isRuntimesEmpty = await deleteRuntimesV2({ page, billingProject, workspaceName });
    if (isAppsEmpty && isRuntimesEmpty) {
      // TODO [IA-4337] fix disk delete as part of runtime delete
      // Once that's done, should not need to wait
      await delay(Millis.ofMinutes(3));
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
      throw new Error(`Cannot attempt to delete workspace ${workspaceName} with billing project: ${billingProject}: unable to delete child resource`);
    }
  } catch (e) {
    console.error(`Failed to delete workspace: ${workspaceName} with billing project: ${billingProject}`);
    console.error(e);
    throw e;
  }
  console.info(`Deleted workspace: ${workspaceName}`);
};

const deleteWorkspaceV2 = withSignedInPage(deleteWorkspaceV2AsUser);

/** Create a GCP workspace, run the given test, then delete the workspace. */
const withWorkspace = (test) => async (options) => {
  console.log('withWorkspace ...');
  const { workspaceName } = await makeGcpWorkspace(options);

  try {
    await test({ ...options, workspaceName });
  } finally {
    console.log('withWorkspace cleanup ...');
    await deleteWorkspace({ ...options, workspaceName });
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

/** Deletes all v2 apps in a workspace. Returns true if all deletes succeed. */
const deleteAppsV2 = async ({ page, billingProject, workspaceName }) => {
  const workspaceId = await page.evaluate(
    async (billingProject, workspaceName) => {
      const {
        workspace: { workspaceId },
      } = await window.Ajax().Workspaces.workspace(billingProject, workspaceName).details(['workspace.workspaceId']);
      return workspaceId;
    },
    billingProject,
    workspaceName
  );
  const deletableApps = await page.evaluate(async (workspaceId) => {
    const apps = await window.Ajax().Apps.listAppsV2(workspaceId);
    return apps;
  }, workspaceId);
  const deletedApps = await Promise.all(
    deletableApps.map(async (app) => {
      const isAppDeleted = await fullyDeleteApp(page, app);
      return {
        name: app.appName,
        isDeleted: isAppDeleted,
      };
    })
  );
  const deletedAppsLog = deletedApps.map(({ name, isDeleted }) => {
    const appLog = isDeleted ? name : `FAILED:${name}`;
    return appLog;
  });
  console.info(`deleted v2 apps: ${deletedAppsLog}`);
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
  const workspaceId = await page.evaluate(
    async (billingProject, workspaceName) => {
      const {
        workspace: { workspaceId },
      } = await window.Ajax().Workspaces.workspace(billingProject, workspaceName).details(['workspace.workspaceId']);
      return workspaceId;
    },
    billingProject,
    workspaceName
  );
  const deletableRuntimes = await page.evaluate(async (workspaceId) => {
    return await window.Ajax().Runtimes.listV2WithWorkspace(workspaceId, { role: 'creator' });
  }, workspaceId);
  const deletedRuntimes = await Promise.all(
    deletableRuntimes.map(async (runtime) => {
      const isRuntimeDeleted = await fullyDeleteRuntime(page, runtime);
      return {
        name: runtime.runtimeName,
        isDeleted: isRuntimeDeleted,
      };
    })
  );
  const deletedRuntimesLog = deletedRuntimes.map(async ({ name, isDeleted }) => (isDeleted ? name : `FAILED:${name}`));
  console.info(`deleted v2 runtimes (and disks): ${deletedRuntimesLog}`);
  return deletedRuntimes.every((runtime) => runtime.isDeleted);
};

/**
 * Delete a v2 app, returning `true` when deletion is complete.
 * Will return `false` if app is not deletable.
 */
const fullyDeleteApp = async (page, app) => {
  const { workspaceId, appName, status } = app;
  const isDeletable = isResourceDeletable('app', status);
  if (!isDeletable) {
    console.error(`Cannot delete app ${appName} in workspace ${workspaceId} with status ${status}. Try deleting it manually.`);
    return false;
  }

  await page.evaluate(
    async (workspaceId, appName) => {
      await window.Ajax().Apps.deleteAppV2(appName, workspaceId);
    },
    workspaceId,
    appName
  );

  let newStatus = status;
  let count = 0;
  do {
    count++;
    await delay(Millis.ofSeconds(10));
    newStatus = await page.evaluate(
      async (workspaceId, appName) => {
        try {
          const appState = window.Ajax().Apps.getAppV2(appName, workspaceId);
          return appState.status;
        } catch (response) {
          if (response.status === 404) {
            return 'Deleted';
          }
          throw response;
        }
      },
      workspaceId,
      appName
    );
  } while (newStatus === 'Deleting' && count < 18);

  if (newStatus === 'Deleted') {
    console.log(`deleted app: ${appName}`);
    return true;
  }
  console.error(`delete app ${appName} failed: now in ${newStatus}`);
  return false;
};

/**
 * Delete a v2 disk, returning `true` when deletion is complete.
 * Will return `false` if disk is not deletable.
 */
const fullyDeleteDisk = async (page, disk) => {
  if (!disk) {
    console.log('Disk does not exist');
    return true;
  }
  const { id, cloudContext, name, status } = disk;
  const isDeletable = isResourceDeletable('disk', status);
  if (!isDeletable) {
    console.error(`Cannot delete disk ${name} in workspace ${cloudContext} with status ${status}. Try deleting it manually.`);
    return false;
  }

  await page.evaluate(async (diskId) => {
    const disksV2Api = window.Ajax().Disks.disksV2();
    await disksV2Api.delete(diskId);
  }, id);

  let newStatus = status;
  let count = 0;
  do {
    count++;
    await delay(Millis.ofSeconds(10));
    newStatus = await page.evaluate(
      async (cloudContext, diskName) => {
        try {
          const diskV1Api = window.Ajax().Disks.disksV1().disk(cloudContext, diskName);
          const diskState = await diskV1Api.details();
          return diskState.status;
        } catch (response) {
          if (response.status === 404) {
            return 'Deleted';
          }
          throw response;
        }
      },
      cloudContext,
      name
    );
  } while (newStatus === 'Deleting' && count < 18);
  if (newStatus === 'Deleted') {
    console.log(`deleted disk: ${name}`);
    return true;
  }
  console.error(`delete disk ${name} failed: now in ${newStatus}`);
  return false;
};

/**
 * Delete a v2 runtime, returning `true` when deletion is complete. Deletes the associated disk.
 * Will return `false` if runtime or disk is not deletable.
 */
const fullyDeleteRuntime = async (page, runtime) => {
  const { workspaceId, runtimeName, status } = runtime;
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

  let newStatus = status;
  let count = 0;
  do {
    count++;
    await delay(Millis.ofSeconds(10));
    newStatus = await page.evaluate(
      async (workspaceId, runtimeName) => {
        try {
          const runtimeApi = window.Ajax().Runtimes.runtimeV2(workspaceId, runtimeName);
          const runtimeState = await runtimeApi.details();
          return runtimeState.status;
        } catch (response) {
          if (response.status === 404) {
            return 'Deleted';
          }
          throw response;
        }
      },
      workspaceId,
      runtimeName
    );
  } while (newStatus === 'Deleting' && count < 18);
  if (newStatus === 'Deleted') {
    console.log(`deleted runtime: ${runtimeName}`);
    return true;
  }
  console.log(`delete runtime ${runtimeName} failed: now in ${newStatus}`);
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

  // TODO [IA-4682, WM-2367] fix race condition that causes infinite spinner on Analyses page without this delay
  await delay(Millis.ofSeconds(20));
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
  deleteAppsV2,
  fullyDeleteDisk,
  deleteRuntimes,
  deleteRuntimesV2,
  deleteWorkspaceV2,
  deleteWorkspaceV2AsUser,
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
