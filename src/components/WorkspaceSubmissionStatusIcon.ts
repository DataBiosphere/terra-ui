import { TooltipTrigger } from '@terra-ui-packages/components';
import { cond, switchCase } from '@terra-ui-packages/core-utils';
import { isAfter, parseJSON } from 'date-fns/fp';
import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { DelayedRender } from 'src/components/common';
import { icon, spinner } from 'src/components/icons';
import colors from 'src/libs/colors';
import { WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';

export type WorkspaceSubmissionStatus = 'success' | 'failure' | 'running';

export const workspaceSubmissionStatus = (workspace: Workspace): WorkspaceSubmissionStatus | undefined => {
  const stats = workspace.workspaceSubmissionStats;
  if (!stats) return undefined;
  const { runningSubmissionsCount, lastSuccessDate, lastFailureDate } = stats;
  return cond(
    [!!runningSubmissionsCount, () => 'running'],
    [
      !!lastSuccessDate && (!lastFailureDate || isAfter(parseJSON(lastFailureDate), parseJSON(lastSuccessDate))),
      () => 'success',
    ],
    [!!lastFailureDate, () => 'failure']
  );
};

interface WorkspaceSubmissionStatusIconProps {
  status: WorkspaceSubmissionStatus | undefined;
  loadingSubmissionStats: boolean;
  size?: number;
}

export const WorkspaceSubmissionStatusIcon = (props: WorkspaceSubmissionStatusIconProps): ReactNode => {
  const { status, loadingSubmissionStats, size = 20 } = props;
  return cond(
    [
      loadingSubmissionStats,
      () =>
        h(DelayedRender, [
          h(
            TooltipTrigger,
            {
              content: 'Loading submission status',
              side: 'left',
            },
            // @ts-expect-error
            [spinner({ size })]
          ),
        ]),
    ],
    [
      !!status,
      () =>
        h(
          TooltipTrigger,
          {
            content: span([
              'Last submitted workflow status: ',
              // the cond means status has already been verified to be defined
              span({ style: { fontWeight: 600 } }, [_.startCase(status!)]),
            ]),
            side: 'left',
          },
          [
            switchCase(
              status,
              [
                'success',
                () =>
                  icon('success-standard', {
                    size,
                    style: { color: colors.success() },
                    'aria-label': 'Workflow Status Success',
                  }),
              ],
              [
                'failure',
                () =>
                  icon('error-standard', {
                    size,
                    style: { color: colors.danger(0.85) },
                    'aria-label': 'Workflow Status Failure',
                  }),
              ],
              [
                'running',
                () =>
                  icon('sync', { size, style: { color: colors.success() }, 'aria-label': 'Workflow Status Running' }),
              ]
            ),
          ]
        ),
    ],
    () => div({ className: 'sr-only' }, ['No workflows have been run'])
  );
};
