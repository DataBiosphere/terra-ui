import _ from 'lodash/fp';
import { Fragment, useCallback, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import { Dataset } from 'src/libs/ajax/Catalog';
import { resolveWdsUrl, WdsDataTableProvider } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useOnMount } from 'src/libs/react-utils';
import { asyncImportJobStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { useDataCatalog } from 'src/pages/library/dataBrowser-utils';
import { notifyDataImportProgress } from 'src/workspace-data/import-jobs';

import { TemplateWorkspaceInfo } from './import-types';
import { ImportDataDestination } from './ImportDataDestination';
import { ImportDataOverview } from './ImportDataOverview';
import { isProtectedSource } from './protected-data-utils';

// ImportData handles all the information relating to the page itself - this includes:
// * Reading from the URL
// * Loading initial Data
// * Managing the import
export const ImportData = () => {
  const {
    query: {
      url,
      format,
      ad,
      wid,
      template,
      snapshotId,
      snapshotName,
      snapshotIds,
      referrer,
      tdrmanifest,
      catalogDatasetId,
      tdrSyncPermissions,
    },
  } = Nav.useRoute();
  const [templateWorkspaces, setTemplateWorkspaces] = useState<{ [key: string]: TemplateWorkspaceInfo[] }>();
  const [userHasBillingProjects, setUserHasBillingProjects] = useState(true);
  const [snapshotResponses, setSnapshotResponses] = useState<{ status: string; message: string | undefined }[]>();
  const [isImporting, setIsImporting] = useState(false);

  const { dataCatalog } = useDataCatalog();
  const snapshots = _.flow(
    _.filter((snapshot: Dataset) => _.includes(snapshot['dct:identifier'] as string, snapshotIds)),
    _.map((snapshot) => ({
      id: snapshot['dct:identifier'],
      title: snapshot['dct:title'],
      description: snapshot['dct:description'],
    }))
  )(dataCatalog);

  const isDataset = !_.includes(format, ['snapshot', 'tdrexport']);
  const header = Utils.cond(
    [referrer === 'data-catalog', () => 'Linking data to a workspace'],
    [isDataset, () => `Dataset ${snapshotName}`],
    [Utils.DEFAULT, () => `Snapshot ${snapshotName}`]
  );

  const isProtectedData = isProtectedSource(url, format);

  // Normalize the snapshot name:
  // Importing snapshot will throw an "enum" error if the name has any spaces or special characters
  // Replace all whitespace characters with _
  // Then replace all non alphanumeric characters with nothing
  const normalizeSnapshotName = (input) => _.flow(_.replace(/\s/g, '_'), _.replace(/[^A-Za-z0-9-_]/g, ''))(input);

  useOnMount(() => {
    const loadTemplateWorkspaces = _.flow(
      Utils.withBusyState(setIsImporting),
      withErrorReporting('Error loading initial data')
    )(async () => {
      const templates = await Ajax().FirecloudBucket.getTemplateWorkspaces();
      setTemplateWorkspaces(templates);
      const projects = await Ajax().Billing.listProjects();
      setUserHasBillingProjects(projects.length > 0);
    });
    loadTemplateWorkspaces();
  });

  const importPFB = (namespace, name) => {
    return async () => {
      const { jobId } = await Ajax().Workspaces.workspace(namespace, name).importJob(url, 'pfb', null);
      asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }));
      notifyDataImportProgress(jobId);
    };
  };

  const importEntitiesJson = (namespace, name) => {
    return async () => {
      await Ajax().Workspaces.workspace(namespace, name).importJSON(url);
      notify('success', 'Data imported successfully.', { timeout: 3000 });
    };
  };

  const loadWdsUrl = useCallback((workspaceId) => {
    return Ajax().Apps.listAppsV2(workspaceId).then(resolveWdsUrl);
  }, []);

  const importTdrExport = (workspace) => {
    // For new workspaces, cloudPlatform is blank
    if (workspace.cloudPlatform === 'Azure' || workspace.googleProject === '') {
      return async () => {
        // find wds for this workspace
        const wdsUrl = await loadWdsUrl(workspace.workspaceId);
        const wdsDataTableProvider = new WdsDataTableProvider(workspace.workspaceId, wdsUrl);

        // call import snapshot
        wdsDataTableProvider.importTdr(workspace.workspaceId, snapshotId);
      };
    }
    const { namespace, name } = workspace;
    return async () => {
      const { jobId } = await Ajax()
        .Workspaces.workspace(namespace, name)
        .importJob(tdrmanifest, 'tdrexport', { tdrSyncPermissions: tdrSyncPermissions === 'true' });
      asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }));
      notifyDataImportProgress(jobId);
    };
  };

  const importSnapshot = (namespace, name) => {
    return async () => {
      if (!_.isEmpty(snapshots)) {
        const responses = await Promise.allSettled(
          _.map(({ title, id, description }) => {
            return Ajax()
              .Workspaces.workspace(namespace, name)
              .importSnapshot(id, normalizeSnapshotName(title), description);
          }, snapshots)
        );

        if (_.some({ status: 'rejected' }, responses)) {
          const normalizedResponses = (await Promise.all(
            _.map(async ({ status, reason }: { status: string; reason: Response | undefined }) => {
              const reasonJson = await reason?.json();
              const { message } = JSON.parse(reasonJson?.message || '{}');
              return { status, message };
            }, responses)
          )) as unknown as { status: string; message: string | undefined }[];
          setSnapshotResponses(normalizedResponses);

          // Consolidate the multiple errors into a single error message
          const numFailures = _.flow(_.filter({ status: 'rejected' }), _.size)(normalizedResponses);
          throw new Error(
            `${numFailures} snapshot${
              numFailures > 1 ? 's' : ''
            } failed to import. See details in the "Linking to Workspace" section`
          );
        }
      } else {
        await Ajax()
          .Workspaces.workspace(namespace, name)
          .importSnapshot(snapshotId, normalizeSnapshotName(snapshotName));
        notify('success', 'Snapshot imported successfully.', { timeout: 3000 });
      }
    };
  };

  const exportCatalog = (workspaceId) => {
    return async () => {
      await Ajax().Catalog.exportDataset({ id: catalogDatasetId, workspaceId });
      notify('success', 'Catalog dataset imported successfully.', { timeout: 3000 });
    };
  };

  const onImport = _.flow(
    Utils.withBusyState(setIsImporting),
    withErrorReporting('Import Error')
  )(async (workspace) => {
    const { namespace, name } = workspace;

    await Utils.switchCase(
      format,
      ['PFB', importPFB(namespace, name)],
      ['entitiesJson', importEntitiesJson(namespace, name)],
      ['tdrexport', importTdrExport(workspace)],
      ['snapshot', importSnapshot(namespace, name)],
      ['catalog', exportCatalog(workspace.workspaceId)],
      [
        Utils.DEFAULT,
        async () => {
          await Ajax().Workspaces.workspace(namespace, name).importBagit(url);
          notify('success', 'Data imported successfully.', { timeout: 3000 });
        },
      ]
    );
    Ajax().Metrics.captureEvent(Events.workspaceDataImport, { format, ...extractWorkspaceDetails(workspace) });
    Nav.goToPath('workspace-data', { namespace, name });
  });

  return h(Fragment, [
    h(ImportDataOverview, { header, snapshots, isDataset, snapshotResponses, url, isProtectedData }),
    h(ImportDataDestination, {
      initialSelectedWorkspaceId: wid,
      templateWorkspaces,
      template,
      userHasBillingProjects,
      importMayTakeTime: isDataset,
      requiredAuthorizationDomain: ad,
      onImport,
      isProtectedData,
    }),
    isImporting && spinnerOverlay,
  ]);
};
