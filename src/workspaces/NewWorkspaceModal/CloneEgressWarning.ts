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
  sourceAzureWorkspaceRegion: string;
  selectedBillingProjectRegion: string | undefined;
  requesterPaysError: boolean;
  selectedGcpBucketLocation: string;
  sourceGCPWorkspaceRegion: string;
}

export const CloneEgressWarning = (props: CloneEgressWarningProps): ReactNode => {
  const isAzureWorkspace = props.isAzureWorkspace;
  const sourceAzureWorkspaceRegion = props.sourceAzureWorkspaceRegion;
  const selectedBillingProjectRegion = props.selectedBillingProjectRegion;
  const requesterPaysError = props.requesterPaysError;
  const selectedGcpBucketLocation = props.selectedGcpBucketLocation;
  const sourceGCPWorkspaceRegion = props.sourceGCPWorkspaceRegion;

  const shouldShowAzureRegionWarning =
    isAzureWorkspace &&
    // We don't have region information for the workspace being cloned (can be a transient error)
    (sourceAzureWorkspaceRegion === '' ||
      // We don't have region information for the selected billing project (may not be backfilled)
      !selectedBillingProjectRegion ||
      // The regions don't match
      selectedBillingProjectRegion !== sourceAzureWorkspaceRegion);

  const haveAzureRegionNames =
    !!selectedBillingProjectRegion && selectedBillingProjectRegion !== '' && sourceAzureWorkspaceRegion !== '';

  const shouldShowGcpDifferentRegionWarning =
    !isAzureWorkspace && !requesterPaysError && selectedGcpBucketLocation !== sourceGCPWorkspaceRegion;

  const cloningRequesterPaysWorkspace = !isAzureWorkspace && requesterPaysError;

  if (shouldShowGcpDifferentRegionWarning || cloningRequesterPaysWorkspace) {
    const sourceLocationType = getLocationType(sourceGCPWorkspaceRegion);
    const destLocationType = getLocationType(selectedGcpBucketLocation);

    return div({ style: { ...warningStyle } }, [
      icon('warning-standard', {
        size: 24,
        style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' },
      }),
      div({ style: { flex: 1 } }, [
        cloningRequesterPaysWorkspace
          ? span(['Copying data may incur network egress charges. '])
          : span([
              'Copying data from ',
              strong([getRegionInfo(sourceGCPWorkspaceRegion, sourceLocationType).regionDescription]),
              ' to ',
              strong([getRegionInfo(selectedGcpBucketLocation, destLocationType).regionDescription]),
              ' may incur network egress charges. ',
            ]),
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
  if (isAzureWorkspace && shouldShowAzureRegionWarning) {
    return div({ style: { ...warningStyle } }, [
      icon('warning-standard', {
        size: 24,
        style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' },
      }),
      div({ style: { flex: 1 } }, [
        !haveAzureRegionNames
          ? span(['Copying data may incur network egress charges. '])
          : span([
              'Copying data from ',
              strong([getRegionLabel(sourceAzureWorkspaceRegion)]),
              ' to ',
              strong([getRegionLabel(selectedBillingProjectRegion)]),
              ' may incur network egress charges. ',
            ]),
        'If possible, select a billing project in the same region as the original workspace to prevent charges.',
      ]),
    ]);
  }
  return null;
};
