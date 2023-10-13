import { icon } from '@terra-ui-packages/components';
import { ReactNode } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import TitleBar from 'src/components/TitleBar';
import colors from 'src/libs/colors';
import { WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';

interface WorkspaceDeletingBannerProps {
  workspace?: Workspace;
}

export const WorkspaceDeletingBanner = (props: WorkspaceDeletingBannerProps): ReactNode => {
  const { workspace } = props;
  if (workspace?.workspace?.state === 'Deleting' || workspace?.workspace?.state === 'DeleteFailed') {
    return h(TitleBar, {
      title: div(
        {
          role: 'alert',
          style: { display: 'flex', alignItems: 'center', margin: '1rem' },
        },
        [
          icon('syncAlt', { size: 32, style: { color: colors.danger(), marginRight: '0.5rem' } }),
          span({ style: { color: colors.dark(), fontSize: 14 } }, [
            'Workspace deletion in progress. Analyses, Workflow, and Data tools are no longer accessible.',
          ]),
        ]
      ),
      style: { backgroundColor: colors.accent(0.35), borderBottom: `1px solid ${colors.accent()}` },
      onDismiss: () => {},
      hideCloseButton: true,
    });
  }
  return undefined;
};
