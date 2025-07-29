import { Fragment, ReactNode } from 'react';
import { dl, h } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { TooltipCell } from 'src/components/table';
import { ReactComponent as GcpLogo } from 'src/images/gcp.svg';
import { Metrics } from 'src/libs/ajax/Metrics';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { InitializedWorkspaceWrapper as Workspace, StorageDetails } from 'src/workspaces/common/state/useWorkspace';
import { BucketLocation } from 'src/workspaces/dashboard/BucketLocation';
import { InfoRow } from 'src/workspaces/dashboard/InfoRow';
import { GoogleWorkspace, isGoogleWorkspace } from 'src/workspaces/utils';

interface CloudInformationProps {
  storageDetails: StorageDetails;
  workspace: Workspace;
}

interface GoogleCloudInformationProps extends CloudInformationProps {
  workspace: GoogleWorkspace & { workspaceInitialized: boolean };
}

const GoogleCloudInformation = (props: GoogleCloudInformationProps): ReactNode => {
  const { workspace, storageDetails } = props;
  const { googleProject } = workspace.workspace;

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
