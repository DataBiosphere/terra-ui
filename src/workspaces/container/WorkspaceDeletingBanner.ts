import { icon, Link, Modal } from '@terra-ui-packages/components';
import { Fragment, ReactNode, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import ErrorView from 'src/components/ErrorView';
import TitleBar from 'src/components/TitleBar';
import colors from 'src/libs/colors';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface WorkspaceDeletingBannerProps {
  workspace?: Workspace;
}

export const WorkspaceDeletingBanner = (props: WorkspaceDeletingBannerProps): ReactNode => {
  const { workspace } = props;
  if (workspace?.workspace?.state === 'Deleting') {
    return h(DeletingStateBanner);
  }
  if (workspace?.workspace?.state === 'DeleteFailed') {
    return h(DeleteFailedStateBanner, props);
  }
  return undefined;
};

const DeletingStateBanner = (): ReactNode => {
  return h(TitleBar, {
    title: div(
      {
        role: 'alert',
        style: { display: 'flex', alignItems: 'center', margin: '1rem' },
      },
      [
        icon('syncAlt', {
          size: 32,
          style: { color: colors.danger(), animation: 'rotation 2s infinite linear', marginRight: '0.5rem' },
        }),
        span({ style: { color: colors.dark(), fontSize: 14 } }, [
          'Workspace deletion in progress. Analyses, Workflow, and Data tools are no longer accessible.',
        ]),
      ]
    ),
    style: { backgroundColor: colors.warning(0.1), borderBottom: `1px solid ${colors.accent()}` },
    onDismiss: () => {},
    hideCloseButton: true,
  });
};

const DeleteFailedStateBanner = (props: WorkspaceDeletingBannerProps): ReactNode => {
  const { workspace } = props;
  const [showDetails, setShowDetails] = useState<boolean>(false);
  return h(Fragment, [
    h(TitleBar, {
      title: div(
        {
          role: 'alert',
          style: { display: 'flex', alignItems: 'center', margin: '1rem' },
        },
        [
          icon('error-standard', { size: 32, style: { color: colors.danger(), marginRight: '0.5rem' } }),
          span({ style: { color: colors.dark(), fontSize: 14, marginRight: '0.5rem' } }, [
            'Error deleting workspace. Analyses, Workflow, and Data tools are no longer accessible.',
          ]),

          workspace?.workspace.errorMessage
            ? h(
                Link,
                {
                  onClick: () => setShowDetails(true),
                  style: { fontSize: 14, marginRight: '0.5rem' },
                },
                ['See error details.']
              )
            : null,
        ]
      ),
      style: { backgroundColor: colors.warning(0.1), borderBottom: `1px solid ${colors.accent()}` },
      onDismiss: () => {},
      hideCloseButton: true,
    }),

    showDetails
      ? h(
          Modal,
          {
            width: 800,
            title: 'Error deleting workspace',
            showCancel: false,
            showX: true,
            onDismiss: () => setShowDetails(false),
          },
          [h(ErrorView, { error: workspace?.workspace.errorMessage ?? 'No error message available' })]
        )
      : null,
  ]);
};
