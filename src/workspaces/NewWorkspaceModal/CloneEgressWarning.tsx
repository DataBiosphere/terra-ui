import { Icon, Link } from '@terra-ui-packages/components';
import { CSSProperties, ReactNode } from 'react';
import * as React from 'react';
import { getLocationType, getRegionInfo } from 'src/components/region-common';
import { BillingProject } from 'src/libs/ajax/billing/Billing';
import { getRegionLabel } from 'src/libs/azure-utils';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import { BaseWorkspace, isAzureWorkspace } from 'src/workspaces/utils';

const warningStyle: CSSProperties = {
  border: `1px solid ${colors.warning(0.8)}`,
  borderRadius: '5px',
  backgroundColor: colors.warning(0.15),
  display: 'flex',
  lineHeight: '18px',
  padding: '1rem 1rem',
  margin: '0.5rem 0 1rem',
  fontWeight: 'normal',
  fontSize: 14,
};

export interface CloneEgressWarningProps {
  sourceWorkspace: BaseWorkspace;
  sourceAzureWorkspaceRegion: string; // default value is ''
  selectedBillingProject: BillingProject;
  sourceGCPWorkspaceRegion: string; // default is a defaultLocation ('US-CENTRAL1')
  sourceGCPWorkspaceRegionError: boolean; // did we encounter an error getting the actual GCP workspace bucket location?
  selectedGcpBucketLocation: string | undefined;
}

export const CloneEgressWarning = (props: CloneEgressWarningProps): ReactNode => {
  const sourceWorkspace = props.sourceWorkspace;
  const sourceAzureWorkspaceRegion = props.sourceAzureWorkspaceRegion;
  const selectedBillingProject = props.selectedBillingProject;
  const sourceGCPWorkspaceRegionError = props.sourceGCPWorkspaceRegionError;
  const selectedGcpBucketLocation = props.selectedGcpBucketLocation;
  const sourceGCPWorkspaceRegion = props.sourceGCPWorkspaceRegion;

  const azureBillingProjectRegion = 'region' in selectedBillingProject ? selectedBillingProject.region : '';

  const haveAzureRegionNames = azureBillingProjectRegion !== '' && sourceAzureWorkspaceRegion !== '';

  const shouldShowAzureRegionWarning =
    isAzureWorkspace(sourceWorkspace) &&
    // We are cloning to a different billing project AND
    selectedBillingProject.projectName !== sourceWorkspace.workspace.namespace &&
    // We don't have region information for either the source workspace (can be a transient state)
    // or the destination billing project (not backfilled yet) OR
    (!haveAzureRegionNames ||
      // regions are different
      azureBillingProjectRegion !== sourceAzureWorkspaceRegion);

  const shouldShowGcpRegionWarning =
    !isAzureWorkspace(sourceWorkspace) &&
    // If we could not get the source workspace bucket location, we default to showing a generic warning.
    (sourceGCPWorkspaceRegionError ||
      (!!selectedGcpBucketLocation && selectedGcpBucketLocation !== sourceGCPWorkspaceRegion));

  const genericEgressMessage = <span>Copying data may incur network egress charges.</span>;
  const renderRegionSpecificMessage = (sourceRegion: string, destinationRegion: string): ReactNode => {
    return (
      <span>
        Copying data from <strong>{sourceRegion}</strong> to <strong>{destinationRegion}</strong> may incur network
        egress charges.
      </span>
    );
  };

  if (shouldShowAzureRegionWarning) {
    return (
      <div style={warningStyle}>
        <Icon
          icon='warning-standard'
          size={24}
          style={{ color: colors.warning(), flex: 'none', marginRight: '0.5rem' }}
        />
        <div style={{ flex: 1 }}>
          {!haveAzureRegionNames
            ? genericEgressMessage
            : renderRegionSpecificMessage(
                getRegionLabel(sourceAzureWorkspaceRegion),
                getRegionLabel(azureBillingProjectRegion)
              )}
          <span> </span>
          If possible, select a billing project in the same region as the original workspace to prevent charges.
        </div>
      </div>
    );
  }
  if (shouldShowGcpRegionWarning) {
    return (
      <div style={warningStyle}>
        <Icon
          icon='warning-standard'
          size={24}
          style={{ color: colors.warning(), flex: 'none', marginRight: '0.5rem' }}
        />
        <div style={{ flex: 1 }}>
          {sourceGCPWorkspaceRegionError
            ? genericEgressMessage
            : renderRegionSpecificMessage(
                getRegionInfo(sourceGCPWorkspaceRegion, getLocationType(sourceGCPWorkspaceRegion)).regionDescription,
                getRegionInfo(selectedGcpBucketLocation, getLocationType(selectedGcpBucketLocation)).regionDescription
              )}
          <span> </span>
          To prevent charges, the new bucket location needs to stay in the same region as the original one.
          <span> </span>
          <Link href='https://support.terra.bio/hc/en-us/articles/360058964552' {...Utils.newTabLinkProps}>
            For more information please read the documentation.
            <Icon icon='pop-out' size={12} style={{ marginLeft: '0.25rem' }} />
          </Link>
        </div>
      </div>
    );
  }

  // No warning to display
  return null;
};
