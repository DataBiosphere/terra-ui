import { useThemeFromContext, TooltipTrigger } from '@terra-ui-packages/components';
import React from 'react';
import { icon } from 'src/components/icons';

// These are for calling attention to resources that are most likely linked to GCP v1 workspaces.
// Rawls will no longer return v1 workspaces, but Leo does not have a way to filter out disks/cloud environments related to them.
export const unsupportedDiskMessage =
  'This disk is not associated with a supported workspace. It is recommended that you delete it to avoid additional cloud costs.';
export const unsupportedCloudEnvironmentMessage =
  'This cloud environment is not associated with a supported workspace. It is recommended that you delete it to avoid additional cloud costs.';
export const UnsupportedWorkspaceCell = ({ status, message }) => {
  const { colors } = useThemeFromContext();

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        // margin/padding set to force the background color to fill the entire cell. SimpleFlexTable does
        // not provide a way to override the styling at the cell level.
        height: '100%',
        margin: '-1rem',
        paddingLeft: '1rem',
        backgroundColor: colors.danger(0.15),
        justifyContent: 'center',
      }}
    >
      <TooltipTrigger content={message}>
        <div aria-label={message}>
          {status}
          {icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.danger() } })}
        </div>
      </TooltipTrigger>
    </div>
  );
};
