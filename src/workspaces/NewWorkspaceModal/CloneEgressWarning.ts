import { icon, Link } from '@terra-ui-packages/components';
import { CSSProperties, ReactNode } from 'react';
import { div, h, span, strong } from 'react-hyperscript-helpers';
import { getLocationType, getRegionInfo } from 'src/components/region-common';
import { getRegionLabel } from 'src/libs/azure-utils';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';

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
  isAzureWorkspace: boolean;
  sourceAzureWorkspaceRegion: string; // default value is ''
  selectedAzureBillingProjectRegion: string | undefined;
  sourceGCPWorkspaceRegion: string; // default is a defaultLocation ('US-CENTRAL1')
  selectedGcpBucketLocation: string | undefined;
  requesterPaysError: boolean;
}

export const CloneEgressWarning = (props: CloneEgressWarningProps): ReactNode => {
  const isAzureWorkspace = props.isAzureWorkspace;
  const sourceAzureWorkspaceRegion = props.sourceAzureWorkspaceRegion;
  const selectedAzureBillingProjectRegion = props.selectedAzureBillingProjectRegion;
  const requesterPaysError = props.requesterPaysError;
  const selectedGcpBucketLocation = props.selectedGcpBucketLocation;
  const sourceGCPWorkspaceRegion = props.sourceGCPWorkspaceRegion;

  const shouldShowAzureRegionWarning =
    isAzureWorkspace &&
    // We don't have region information for the workspace being cloned (can be a transient error)
    (sourceAzureWorkspaceRegion === '' ||
      // We don't have region information for the selected billing project (may not be backfilled)
      !selectedAzureBillingProjectRegion ||
      // Have both regions, but they don't match
      selectedAzureBillingProjectRegion !== sourceAzureWorkspaceRegion);

  const shouldShowGcpRegionWarning =
    !isAzureWorkspace &&
    // Requester pays error, so we don't know the source region
    (requesterPaysError ||
      // Regions are different
      (!!selectedGcpBucketLocation && selectedGcpBucketLocation !== sourceGCPWorkspaceRegion));

  const warningIcon = icon('warning-standard', {
    size: 24,
    style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' },
  });

  const genericEgressMessage = span(['Copying data may incur network egress charges. ']);
  const renderRegionSpecificMessage = (sourceRegion: string, destinationRegion: string) => {
    return span([
      'Copying data from ',
      strong([sourceRegion]),
      ' to ',
      strong([destinationRegion]),
      ' may incur network egress charges. ',
    ]);
  };

  if (shouldShowAzureRegionWarning) {
    const haveAzureRegionNames =
      !!selectedAzureBillingProjectRegion &&
      selectedAzureBillingProjectRegion !== '' &&
      sourceAzureWorkspaceRegion !== '';

    return div({ style: { ...warningStyle } }, [
      warningIcon,
      div({ style: { flex: 1 } }, [
        !haveAzureRegionNames
          ? genericEgressMessage
          : renderRegionSpecificMessage(
              getRegionLabel(sourceAzureWorkspaceRegion),
              getRegionLabel(selectedAzureBillingProjectRegion)
            ),
        'If possible, select a billing project in the same region as the original workspace to prevent charges.',
      ]),
    ]);
  }
  if (shouldShowGcpRegionWarning) {
    return div({ style: { ...warningStyle } }, [
      warningIcon,
      div({ style: { flex: 1 } }, [
        requesterPaysError
          ? genericEgressMessage
          : renderRegionSpecificMessage(
              getRegionInfo(sourceGCPWorkspaceRegion, getLocationType(sourceGCPWorkspaceRegion)).regionDescription,
              getRegionInfo(selectedGcpBucketLocation, getLocationType(selectedGcpBucketLocation)).regionDescription
            ),
        'To prevent charges, the new bucket location needs to stay in the same region as the original one. ',
        h(
          Link,
          {
            href: 'https://support.terra.bio/hc/en-us/articles/360058964552',
            ...Utils.newTabLinkProps,
          },
          [
            'For more information please read the documentation.',
            icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } }),
          ]
        ),
      ]),
    ]);
  }

  // No warning to display
  return null;
};
