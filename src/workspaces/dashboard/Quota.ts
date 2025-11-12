import { icon, InfoBox, Link, TooltipTrigger } from '@terra-ui-packages/components';
import { CSSProperties, Fragment } from 'react';
import { br, div, h, h3, span } from 'react-hyperscript-helpers';
import { Metrics } from 'src/libs/ajax/Metrics';
import colors from 'src/libs/colors';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { getTerraUser } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { InitializedWorkspaceWrapper as Workspace } from 'src/workspaces/common/state/useWorkspace';
import { InfoRow } from 'src/workspaces/dashboard/InfoRow';
import { canWrite, isOwner } from 'src/workspaces/utils';

interface QuotaProps {
  workspace: Workspace;
}

const quotaInfoBox = h(InfoBox, { style: { marginLeft: '1ch' } }, [
  'For more information, please refer to the ',
  h(
    Link,
    {
      href: 'https://support.terra.bio/hc/en-us/articles/6396351981595-Are-resource-quotas-slowing-your-analysis-down',
      ...Utils.newTabLinkProps,
    },
    ['resource quota documentation']
  ),
]);

export const Quota = ({ workspace }: QuotaProps) => {
  const { googleProject } = workspace.workspace;
  const { accessLevel, canCompute } = workspace;
  return h(Fragment, [
    h(InfoRow, {
      title: h3(
        {
          style: {
            ...Style.dashboard.collapsibleHeader,
            padding: 0,
            margin: 0,
          } as CSSProperties,
        },
        ['Quota', quotaInfoBox]
      ),
    }),
    h(
      canWrite(accessLevel) && canCompute ? Fragment : TooltipTrigger,
      canWrite(accessLevel) && canCompute
        ? {}
        : {
            content:
              'You do not have permission to view quotas for this project. Please contact your workspace owner(s) for assistance.',
          },
      [
        span({ style: { display: 'inline-block' } }, [
          h(
            Link,
            {
              style: {
                margin: '1rem 0.5rem',
                ...(canWrite(accessLevel) && canCompute
                  ? {}
                  : {
                      color: colors.dark(0.5),
                      pointerEvents: 'none',
                    }),
              },
              href: `https://console.cloud.google.com/iam-admin/quotas?project=${googleProject}&authuser=${
                getTerraUser().email
              }`,
              ...Utils.newTabLinkProps,
              onClick: () => {
                void Metrics().captureEvent(Events.workspaceOpenQuotaInConsole, {
                  ...extractWorkspaceDetails(workspace),
                });
              },
            },
            ['View quotas', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
          ),
        ]),
      ]
    ),
    h(br),
    div({ style: { height: '0.5rem' } }),
    h(
      isOwner(accessLevel) ? Fragment : TooltipTrigger,
      isOwner(accessLevel)
        ? {}
        : {
            content:
              'You do not have permission to adjust quotas for this project. Please contact your workspace owner(s) for assistance.',
          },
      [
        span({ style: { display: 'inline-block' } }, [
          h(
            Link,
            {
              style: {
                margin: '1rem 0.5rem',
                marginTop: '1.5rem',
                ...(isOwner(accessLevel) ? {} : { color: colors.dark(0.5), pointerEvents: 'none' }),
              },
              href: `https://console.cloud.google.com/iam-admin/quotas/configurations?project=${googleProject}&authuser=${
                getTerraUser().email
              }`,
              ...Utils.newTabLinkProps,
              onClick: () => {
                void Metrics().captureEvent(Events.workspaceOpenQuotaInConsole, {
                  ...extractWorkspaceDetails(workspace),
                });
              },
            },
            ['Open quota adjuster', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
          ),
        ]),
      ]
    ),
    h(br),
    div({ style: { height: '0.5rem' } }),
  ]);
};
