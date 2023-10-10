import { cond } from '@terra-ui-packages/core-utils';
import { Fragment, ReactNode } from 'react';
import { div, dl, h } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TooltipCell } from 'src/components/table';
import { ReactComponent as GcpLogo } from 'src/images/gcp.svg';
import { Ajax } from 'src/libs/ajax';
import { bucketBrowserUrl } from 'src/libs/auth';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { newTabLinkProps } from 'src/libs/utils';
import {
  AzureWorkspace,
  canWrite,
  GoogleWorkspace,
  isAzureWorkspace,
  isGoogleWorkspace,
} from 'src/libs/workspace-utils';
import { AzureStorageDetails } from 'src/pages/workspaces/workspace/Dashboard/AzureStorageDetails';
import { BucketLocation } from 'src/pages/workspaces/workspace/Dashboard/BucketLocation';
import { InfoRow } from 'src/pages/workspaces/workspace/Dashboard/InfoRow';
import { InitializedWorkspaceWrapper as Workspace, StorageDetails } from 'src/pages/workspaces/workspace/useWorkspace';

interface CloudInformationProps {
  storageDetails: StorageDetails;
  workspace: Workspace;
  storageCost?: { isSuccess: boolean; estimate: string; lastUpdated?: string };
  bucketSize?: { isSuccess: boolean; usage: string; lastUpdated?: string };
}

interface AzureCloudInformationProps extends CloudInformationProps {
  workspace: AzureWorkspace & { workspaceInitialized: boolean };
}

interface GoogleCloudInformationProps extends CloudInformationProps {
  workspace: GoogleWorkspace & { workspaceInitialized: boolean };
}

const AzureCloudInformation = (props: AzureCloudInformationProps): ReactNode => {
  const { workspace, storageDetails } = props;
  const azureContext = workspace.azureContext;
  return [
    dl([h(AzureStorageDetails, { azureContext, storageDetails })]),
    div({ style: { margin: '0.5rem', fontSize: 12 } }, [
      div([
        'Use SAS URL in conjunction with ',
        h(
          Link,
          {
            ...newTabLinkProps,
            href: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10',
            style: { textDecoration: 'underline' },
          },
          ['AzCopy']
        ),
        ' or ',
        h(
          Link,
          {
            ...newTabLinkProps,
            href: 'https://azure.microsoft.com/en-us/products/storage/storage-explorer',
            style: { textDecoration: 'underline' },
          },
          ['Azure Storage Explorer']
        ),
        ' to access storage associated with this workspace.',
      ]),
      div({ style: { paddingTop: '0.5rem', fontWeight: 'bold' } }, [
        'The SAS URL expires after 8 hours. To generate a new SAS URL, refresh this page.',
      ]),
    ]),
  ];
};

const GoogleCloudInformation = (props: GoogleCloudInformationProps): ReactNode => {
  const { workspace, storageDetails, storageCost, bucketSize } = props;
  const { accessLevel } = workspace;
  const { googleProject, bucketName } = workspace.workspace;
  return [
    dl([
      h(InfoRow, { title: 'Cloud Name' }, [
        h(GcpLogo, { title: 'Google Cloud Platform', role: 'img', style: { height: 16 } }),
      ]),
      h(InfoRow, { title: 'Location' }, [h(BucketLocation, { workspace, storageDetails })]),
      h(InfoRow, { title: 'Google Project ID' }, [
        h(TooltipCell, [googleProject]),
        h(ClipboardButton, {
          'aria-label': 'Copy google project id to clipboard',
          text: googleProject,
          style: { marginLeft: '0.25rem' },
        }),
      ]),
      h(InfoRow, { title: 'Bucket Name' }, [
        h(TooltipCell, [bucketName]),
        h(ClipboardButton, {
          'aria-label': 'Copy bucket name to clipboard',
          text: bucketName,
          style: { marginLeft: '0.25rem' },
        }),
      ]),
      canWrite(accessLevel) &&
        h(
          InfoRow,
          {
            title: 'Estimated Storage Cost',
            subtitle: cond(
              [!storageCost, () => 'Loading last updated...'],
              [
                !!storageCost?.isSuccess,
                () => `Updated on ${new Date(storageCost?.lastUpdated ?? '').toLocaleDateString()}`,
              ]
            ),
          },
          [storageCost?.estimate || '$ ...']
        ),
      canWrite(accessLevel) &&
        h(
          InfoRow,
          {
            title: 'Bucket Size',
            subtitle: cond(
              [!bucketSize, () => 'Loading last updated...'],
              [
                !!bucketSize?.isSuccess,
                () => `Updated on ${new Date(bucketSize?.lastUpdated ?? '').toLocaleDateString()}`,
              ]
            ),
          },
          [bucketSize?.usage]
        ),
    ]),
    h(Fragment, [
      div({ style: { paddingBottom: '0.5rem' } }, [
        h(
          Link,
          {
            style: { margin: '1rem 0.5rem' },
            ...newTabLinkProps,
            onClick: () => {
              Ajax().Metrics.captureEvent(Events.workspaceOpenedBucketInBrowser, {
                ...extractWorkspaceDetails(workspace),
              });
            },
            href: bucketBrowserUrl(bucketName),
          },
          ['Open bucket in browser', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
        ),
      ]),
      div({ style: { paddingBottom: '0.5rem' } }, [
        h(
          Link,
          {
            style: { margin: '1rem 0.5rem' },
            ...newTabLinkProps,
            onClick: () => {
              Ajax().Metrics.captureEvent(Events.workspaceOpenedProjectInConsole, {
                ...extractWorkspaceDetails(workspace),
              });
            },
            href: `https://console.cloud.google.com/welcome?project=${googleProject}`,
          },
          ['Open project in Google Cloud Console', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
        ),
      ]),
    ]),
  ];
};

export const CloudInformation = (props: CloudInformationProps): ReactNode => {
  const { workspace, ...rest } = props;
  return isAzureWorkspace(workspace)
    ? h(AzureCloudInformation, { workspace, ...rest })
    : isGoogleWorkspace(workspace)
    ? h(GoogleCloudInformation, { workspace, ...rest })
    : h(Fragment);
};
