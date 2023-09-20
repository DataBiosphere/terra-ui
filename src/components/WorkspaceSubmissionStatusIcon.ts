import _ from 'lodash/fp';
import { FC } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { DelayedRender } from 'src/components/common';
import { icon, spinner } from 'src/components/icons';
import TooltipTrigger from 'src/components/TooltipTrigger';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';

interface WorkspaceSubmissionStatusIconProps {
  status;
  loadingSubmissionStats: boolean;
  size?: number;
}

export const WorkspaceSubmissionStatusIcon: FC<WorkspaceSubmissionStatusIconProps> = ({
  status,
  loadingSubmissionStats,
  size = 20,
}) => {
  return Utils.cond(
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
            [spinner({ size } as any)]
          ),
        ]),
    ],
    [
      status,
      () =>
        h(
          TooltipTrigger,
          {
            content: span([
              'Last submitted workflow status: ',
              span({ style: { fontWeight: 600 } }, [_.startCase(status)]),
            ]),
            side: 'left',
          },
          [
            Utils.switchCase(
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
