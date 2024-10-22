import { Fragment, ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { TooltipCell } from 'src/components/table';
import { ReactComponent as AzureLogo } from 'src/images/azure.svg';
import { Metrics } from 'src/libs/ajax/Metrics';
import { getRegionFlag, getRegionLabel } from 'src/libs/azure-utils';
import Events, { EventWorkspaceDetails } from 'src/libs/events';
import { StorageDetails } from 'src/workspaces/common/state/useWorkspace';
import { InfoRow } from 'src/workspaces/dashboard/InfoRow';
import { AzureContext } from 'src/workspaces/utils';

export interface AzureStorageDetailsProps {
  azureContext: AzureContext;
  storageDetails: StorageDetails;
  eventWorkspaceDetails: EventWorkspaceDetails;
}

export const AzureStorageDetails = (props: AzureStorageDetailsProps): ReactNode => {
  const { azureContext, storageDetails, eventWorkspaceDetails } = props;
  return h(Fragment, [
    h(InfoRow, { title: 'Cloud Name' }, [
      h(AzureLogo, { title: 'Microsoft Azure', role: 'img', style: { height: 16 } }),
    ]),
    h(InfoRow, { title: 'Location' }, [
      h(
        TooltipCell,
        storageDetails.azureContainerRegion
          ? [
              getRegionFlag(storageDetails.azureContainerRegion),
              ' ',
              getRegionLabel(storageDetails.azureContainerRegion),
            ]
          : ['Loading']
      ),
    ]),
    h(InfoRow, { title: 'Resource Group ID' }, [
      h(TooltipCell, [azureContext.managedResourceGroupId]),
      h(ClipboardButton, {
        'aria-label': 'Copy resource group ID to clipboard',
        text: azureContext.managedResourceGroupId,
        style: { marginLeft: '0.25rem' },
        onClick: (_) => {
          void Metrics().captureEvent(Events.workspaceDashboardCopyResourceGroup, {
            ...eventWorkspaceDetails,
          });
        },
      }),
    ]),
    h(InfoRow, { title: 'Storage Container URL' }, [
      h(TooltipCell, [storageDetails.azureContainerUrl ? storageDetails.azureContainerUrl : 'Loading']),
      h(ClipboardButton, {
        'aria-label': 'Copy storage container URL to clipboard',
        text: storageDetails.azureContainerUrl || '',
        style: { marginLeft: '0.25rem' },
        onClick: (_) => {
          void Metrics().captureEvent(Events.workspaceDashboardCopyStorageContainerUrl, {
            ...eventWorkspaceDetails,
          });
        },
      }),
    ]),
    h(InfoRow, { title: 'Storage SAS URL' }, [
      h(TooltipCell, [storageDetails.azureContainerSasUrl ? storageDetails.azureContainerSasUrl : 'Loading']),
      h(ClipboardButton, {
        'aria-label': 'Copy SAS URL to clipboard',
        text: storageDetails.azureContainerSasUrl || '',
        style: { marginLeft: '0.25rem' },
        onClick: (_) => {
          void Metrics().captureEvent(Events.workspaceDashboardCopySASUrl, {
            ...eventWorkspaceDetails,
          });
        },
      }),
    ]),
  ]);
};
