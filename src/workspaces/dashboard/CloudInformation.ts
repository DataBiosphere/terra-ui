import { icon, InfoBox, Link } from '@terra-ui-packages/components';
import { formatBytes, formatUSD } from '@terra-ui-packages/core-utils';
import { CSSProperties, Fragment, ReactNode, useEffect, useState } from 'react';
import { br, div, dl, h, h3, hr, span } from 'react-hyperscript-helpers';
import { bucketBrowserUrl } from 'src/auth/auth';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { TooltipCell } from 'src/components/table';
import { ReactComponent as GcpLogo } from 'src/images/gcp.svg';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { useCancellation } from 'src/libs/react-utils';
import { getTerraUser } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { newTabLinkProps } from 'src/libs/utils';
import { InitializedWorkspaceWrapper as Workspace, StorageDetails } from 'src/workspaces/common/state/useWorkspace';
import { BucketLocation } from 'src/workspaces/dashboard/BucketLocation';
import { InfoRow } from 'src/workspaces/dashboard/InfoRow';
import { canRead, canWrite, GoogleWorkspace, isGoogleWorkspace } from 'src/workspaces/utils';

interface CloudInformationProps {
  storageDetails: StorageDetails;
  workspace: Workspace;
}

interface GoogleCloudInformationProps extends CloudInformationProps {
  workspace: GoogleWorkspace & { workspaceInitialized: boolean };
}

const storageStateDisplayName = (rawState: string): string => {
  switch (rawState) {
    case 'live-object':
      return 'Live';
    case 'soft-deleted-object':
      return 'Soft Deleted';
    // we do not expect to see noncurrent-object or multipart-upload in Terra
    case 'noncurrent-object':
      return 'Object Version';
    case 'multipart-upload':
      return 'Multipart Upload';
    default:
      return rawState;
  }
};

const GoogleCloudInformation = (props: GoogleCloudInformationProps): ReactNode => {
  const { workspace, storageDetails } = props;
  const { accessLevel } = workspace;
  const { bucketName, googleProject } = workspace.workspace;

  const signal = useCancellation();

  const [storageCost, setStorageCost] = useState<{ isSuccess: boolean; estimate: string; lastUpdated?: string }>();
  const [bucketSize, setBucketSize] = useState<{
    isSuccess: boolean;
    usageByState: { [key: string]: string };
    lastUpdated?: string;
  }>();

  useEffect(() => {
    const { namespace, name } = workspace.workspace;

    const loadStorageCost = withErrorReporting('Error loading storage cost data')(async () => {
      try {
        const { estimate, usage, lastUpdated } = await Workspaces(signal)
          .workspace(namespace, name)
          .storageCostEstimateV2();

        // Format the sizes-by-state for display
        const sizesByState = Object.fromEntries(
          Object.entries(usage).map(([key, value]) => {
            return [storageStateDisplayName(key), formatBytes(value)];
          })
        ) as { [key: string]: string };

        setStorageCost({ isSuccess: true, estimate: formatUSD(estimate), lastUpdated });
        setBucketSize({ isSuccess: true, usageByState: sizesByState, lastUpdated });
      } catch (error) {
        if (error instanceof Response && error.status === 404) {
          setStorageCost({ isSuccess: false, estimate: 'Not available' });
          setBucketSize({ isSuccess: false, usageByState: { 'Not available': '' } });
        } else {
          throw error;
        }
      }
    });

    if (workspace.workspaceInitialized) {
      if (canRead(accessLevel)) {
        loadStorageCost();
      }
    }
  }, [workspace, accessLevel, signal]);

  return h(Fragment, [
    dl([
      h(InfoRow, { title: 'Cloud Name' }, [
        h(GcpLogo, { title: 'Google Cloud Platform', role: 'img', style: { height: 16 } }),
      ]),
      h(InfoRow, { title: 'Location' }, [h(BucketLocation, { workspace, storageDetails })]),
      h(InfoRow, { title: 'Google Project ID' }, [
        h(TooltipCell, [googleProject]),
        h(ClipboardButton, {
          'aria-label': 'Copy google project ID to clipboard',
          text: googleProject,
          style: { marginLeft: '0.25rem' },
          onClick: (_) => {
            void Metrics().captureEvent(Events.workspaceDashboardCopyGoogleProjectId, {
              ...extractWorkspaceDetails(workspace),
            });
          },
        }),
      ]),
      h(hr),
      h(InfoRow, {
        title: h3({ style: { ...Style.dashboard.collapsibleHeader, padding: 0, margin: 0 } as CSSProperties }, [
          'Storage Details',
        ]),
        subtitle: `Updated on: ${
          storageCost?.lastUpdated ? new Date(storageCost.lastUpdated).toLocaleDateString() : 'Loading last updated...'
        }`,
      }),
      h(InfoRow, { title: 'Bucket Name' }, [
        h(TooltipCell, [bucketName]),
        h(ClipboardButton, {
          'aria-label': 'Copy bucket name to clipboard',
          text: bucketName,
          style: { marginLeft: '0.25rem' },
          onClick: (_) => {
            void Metrics().captureEvent(Events.workspaceDashboardCopyBucketName, {
              ...extractWorkspaceDetails(workspace),
            });
          },
        }),
      ]),
      canWrite(accessLevel) &&
        h(
          InfoRow,
          {
            title: 'Estimated Monthly Cost',
          },
          [
            storageCost?.estimate || '$ ...',
            h(InfoBox, { style: { marginLeft: '1ch' }, side: 'top' }, [
              'Shows estimated cost of all objects in the bucket. Important considerations:',
              h(br),
              h(br),
              '1. Only shows object storage costs. Operations charges and other storage-related charges are not included.',
              h(br),
              '2. Based on GCP list prices. Discounts are not included.',
              h(br),
              h(br),
              span([
                'For more accurate costs, set up ',
                h(
                  Link,
                  { href: 'https://support.terra.bio/hc/en-us/articles/10026441196187', ...Utils.newTabLinkProps },
                  ['spend reporting']
                ),
                ' to access reports for financial oversight and optimization of your cloud costs and resources.',
              ]),
            ]),
          ]
        ),
      canRead(accessLevel) &&
        h(
          InfoRow,
          {
            title: 'Estimated Size',
          },
          !bucketSize?.usageByState
            ? []
            : Object.entries(bucketSize.usageByState).map(([key, value]) => [`${value} ${key}`, br({ key })])
        ),
    ]),
    div({ style: { paddingBottom: '0.5rem' } }, [
      h(
        Link,
        {
          style: { margin: '1rem 0.5rem' },
          ...newTabLinkProps,
          onClick: () => {
            void Metrics().captureEvent(Events.workspaceOpenedBucketInBrowser, {
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
            void Metrics().captureEvent(Events.workspaceOpenedProjectInConsole, {
              ...extractWorkspaceDetails(workspace),
            });
          },
          href: `https://console.cloud.google.com/welcome?project=${googleProject}&authuser=${getTerraUser().email}`,
        },
        ['Open project in Google Cloud Console', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
      ),
    ]),
  ]);
};

export const CloudInformation = (props: CloudInformationProps): ReactNode => {
  const { workspace, ...rest } = props;
  if (isGoogleWorkspace(workspace)) {
    return h(GoogleCloudInformation, { workspace, ...rest });
  }
  return null;
};
