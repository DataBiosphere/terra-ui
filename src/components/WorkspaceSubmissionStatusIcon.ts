import { TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { DelayedRender } from 'src/components/common';
import { icon, spinner } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';

interface WorkspaceSubmissionStatusIconProps {
  status;
  loadingSubmissionStats: boolean;
  size?: number;
}

export const WorkspaceSubmissionStatusIcon = (props: WorkspaceSubmissionStatusIconProps): ReactNode => {
  const { status, loadingSubmissionStats, size = 20 } = props;
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
            // @ts-expect-error
            [spinner({ size })]
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
