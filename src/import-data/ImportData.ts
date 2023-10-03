import _ from 'lodash/fp';
import { Fragment, ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import { Dataset } from 'src/libs/ajax/Catalog';
import { resolveWdsUrl, WdsDataTableProvider } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useOnMount } from 'src/libs/react-utils';
import { asyncImportJobStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { WorkspaceInfo } from 'src/libs/workspace-utils';
import { useDataCatalog } from 'src/pages/library/dataBrowser-utils';
import { notifyDataImportProgress } from 'src/workspace-data/import-jobs';

import {
  BagItImportRequest,
  CatalogDatasetImportRequest,
  CatalogSnapshotsImportRequest,
  EntitiesImportRequest,
  ImportRequest,
  PFBImportRequest,
  TDRSnapshotExportImportRequest,
  TDRSnapshotReferenceImportRequest,
  TemplateWorkspaceInfo,
} from './import-types';
import { ImportDataDestination } from './ImportDataDestination';
import { ImportDataOverview } from './ImportDataOverview';
import { isProtectedSource } from './protected-data-utils';
import { useImportRequest } from './useImportRequest';

const getTitleForImportRequest = (importRequest: ImportRequest): string => {
  if (importRequest.type === 'tdr-snapshot-export') {
    return `Importing snapshot ${importRequest.snapshotName}`;
  }

  if (
    importRequest.type === 'tdr-snapshot-reference' ||
    importRequest.type === 'catalog-dataset' ||
    importRequest.type === 'catalog-snapshots'
  ) {
    return 'Linking data to a workspace';
  }

  return 'Importing data to a workspace';
};

export interface ImportDataProps {
  importRequest: ImportRequest;
}

export const ImportData = (props: ImportDataProps): ReactNode => {
  const { importRequest } = props;
  const {
    query: { ad, format, wid, template },
  } = Nav.useRoute();
  const [templateWorkspaces, setTemplateWorkspaces] = useState<{ [key: string]: TemplateWorkspaceInfo[] }>();
  const [userHasBillingProjects, setUserHasBillingProjects] = useState(true);
  const [snapshotResponses, setSnapshotResponses] = useState<{ status: string; message: string | undefined }[]>();
  const [isImporting, setIsImporting] = useState(false);

  const { dataCatalog } = useDataCatalog();
  const snapshots =
    importRequest.type === 'catalog-snapshots'
      ? _.flow(
          _.filter(
            (snapshot: Dataset) =>
              !!snapshot['dct:identifier'] && _.includes(snapshot['dct:identifier'], importRequest.snapshotIds)
          ),
          _.map((snapshot) => ({
            // The previous step filters the list to only datasets with 'dct:identifier' defined
            id: snapshot['dct:identifier']!,
            title: snapshot['dct:title'],
            description: snapshot['dct:description'],
          }))
        )(dataCatalog)
      : [];

  const isDataset = !_.includes(format, ['snapshot', 'tdrexport']);

  const isProtectedData = importRequest.type === 'pfb' && isProtectedSource(importRequest.url);

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

  const importPFB = async (importRequest: PFBImportRequest, workspace: WorkspaceInfo) => {
    const { namespace, name } = workspace;
    const { jobId } = await Ajax().Workspaces.workspace(namespace, name).importJob(importRequest.url, 'pfb', null);
    asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }));
    notifyDataImportProgress(jobId);
  };

  const importBagit = async (importRequest: BagItImportRequest, workspace: WorkspaceInfo) => {
    const { namespace, name } = workspace;
    await Ajax().Workspaces.workspace(namespace, name).importBagit(importRequest.url);
    notify('success', 'Data imported successfully.', { timeout: 3000 });
  };

  const importEntitiesJson = async (importRequest: EntitiesImportRequest, workspace: WorkspaceInfo) => {
    const { namespace, name } = workspace;
    await Ajax().Workspaces.workspace(namespace, name).importJSON(importRequest.url);
    notify('success', 'Data imported successfully.', { timeout: 3000 });
  };

  const importTdrExport = async (importRequest: TDRSnapshotExportImportRequest, workspace: WorkspaceInfo) => {
    // For new workspaces, cloudPlatform is blank
    if (workspace.cloudPlatform === 'Azure' || workspace.googleProject === '') {
      // find wds for this workspace
      const wdsUrl = await Ajax().Apps.listAppsV2(workspace.workspaceId).then(resolveWdsUrl);
      const wdsDataTableProvider = new WdsDataTableProvider(workspace.workspaceId, wdsUrl);

      // call import snapshot
      wdsDataTableProvider.importTdr(workspace.workspaceId, importRequest.snapshotId);
    }
    const { namespace, name } = workspace;
    const { jobId } = await Ajax()
      .Workspaces.workspace(namespace, name)
      .importJob(importRequest.manifestUrl, 'tdrexport', { tdrSyncPermissions: importRequest.syncPermissions });
    asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }));
    notifyDataImportProgress(jobId);
  };

  const importSnapshot = async (
    importRequest: TDRSnapshotReferenceImportRequest | CatalogSnapshotsImportRequest,
    workspace: WorkspaceInfo
  ) => {
    const { namespace, name } = workspace;
    if (importRequest.type === 'catalog-snapshots') {
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
        .importSnapshot(importRequest.snapshotId, normalizeSnapshotName(importRequest.snapshotName));
      notify('success', 'Snapshot imported successfully.', { timeout: 3000 });
    }
  };

  const exportCatalog = async (importRequest: CatalogDatasetImportRequest, workspace: WorkspaceInfo) => {
    const { workspaceId } = workspace;
    await Ajax().Catalog.exportDataset({ id: importRequest.datasetId, workspaceId });
    notify('success', 'Catalog dataset imported successfully.', { timeout: 3000 });
  };

  const onImport = _.flow(
    Utils.withBusyState(setIsImporting),
    withErrorReporting('Import Error')
  )(async (workspace: WorkspaceInfo) => {
    switch (importRequest.type) {
      case 'pfb':
        await importPFB(importRequest, workspace);
        break;
      case 'bagit':
        await importBagit(importRequest, workspace);
        break;
      case 'entities':
        await importEntitiesJson(importRequest, workspace);
        break;
      case 'tdr-snapshot-export':
        await importTdrExport(importRequest, workspace);
        break;
      case 'tdr-snapshot-reference':
      case 'catalog-snapshots':
        await importSnapshot(importRequest, workspace);
        break;
      case 'catalog-dataset':
        await exportCatalog(importRequest, workspace);
        break;
      default:
        // Use TypeScript to verify that this switch handles all possible values.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveGuard: never = importRequest;
    }

    const { namespace, name } = workspace;
    Ajax().Metrics.captureEvent(Events.workspaceDataImport, { format, ...extractWorkspaceDetails(workspace) });
    Nav.goToPath('workspace-data', { namespace, name });
  });

  return h(Fragment, [
    h(ImportDataOverview, {
      header: getTitleForImportRequest(importRequest),
      snapshots,
      isDataset,
      snapshotResponses,
      url: 'url' in importRequest ? importRequest.url : undefined,
      isProtectedData,
    }),
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

/**
 * Validate the import request from the URL.
 */
export const ImportDataContainer = () => {
  const result = useImportRequest();
  if (!result.isValid) {
    return div(
      {
        style: {
          flexGrow: 1,
          padding: '1rem 1.25rem',
          border: `1px solid ${colors.warning(0.8)}`,
          borderRadius: '0.5rem',
          backgroundColor: colors.warning(0.15),
          fontWeight: 'bold',
        },
      },
      ['Invalid import request.']
    );
  }

  return h(ImportData, { importRequest: result.importRequest });
};
