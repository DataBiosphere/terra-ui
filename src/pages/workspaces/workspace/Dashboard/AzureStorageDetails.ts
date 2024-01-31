import { Fragment, ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { TooltipCell } from 'src/components/table';
import { ReactComponent as AzureLogo } from 'src/images/azure.svg';
import { getRegionFlag, getRegionLabel } from 'src/libs/azure-utils';
import { AzureContext } from 'src/libs/workspace-utils';
import { InfoRow } from 'src/pages/workspaces/workspace/Dashboard/InfoRow';
import { StorageDetails } from 'src/workspaces/container/state/useWorkspace';

interface AzureStorageDetailsProps {
  azureContext: AzureContext;
  storageDetails: StorageDetails;
}

export const AzureStorageDetails = (props: AzureStorageDetailsProps): ReactNode => {
  const { azureContext, storageDetails } = props;
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
      }),
    ]),
    h(InfoRow, { title: 'Storage Container URL' }, [
      h(TooltipCell, [storageDetails.azureContainerUrl ? storageDetails.azureContainerUrl : 'Loading']),
      h(ClipboardButton, {
        'aria-label': 'Copy storage container URL to clipboard',
        text: storageDetails.azureContainerUrl || '',
        style: { marginLeft: '0.25rem' },
      }),
    ]),
    h(InfoRow, { title: 'Storage SAS URL' }, [
      h(TooltipCell, [storageDetails.azureContainerSasUrl ? storageDetails.azureContainerSasUrl : 'Loading']),
      h(ClipboardButton, {
        'aria-label': 'Copy SAS URL to clipboard',
        text: storageDetails.azureContainerSasUrl || '',
        style: { marginLeft: '0.25rem' },
      }),
    ]),
  ]);
};
