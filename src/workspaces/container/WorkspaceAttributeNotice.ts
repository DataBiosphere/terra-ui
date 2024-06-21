import { IconId, TooltipTrigger } from '@terra-ui-packages/components';
import { div, h, span } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import {
  canWrite,
  protectedDataIcon,
  protectedDataLabel,
  regionConstraintLabel,
  WorkspaceAccessLevel,
} from 'src/workspaces/utils';

interface WorkspaceAttributeNoticeProperties {
  accessLevel: WorkspaceAccessLevel;
  isLocked: boolean;
  workspaceProtectedMessage?: string;
  workspaceRegionConstraintMessage?: string;
}

export const WorkspaceAttributeNotice = (props: WorkspaceAttributeNoticeProperties) => {
  const isReadOnly = !canWrite(props.accessLevel);

  return div({}, [
    props.isLocked && h(Notice, { label: 'Locked', tooltip: 'Workspace is locked', iconName: 'lock' }),
    isReadOnly && h(Notice, { label: 'Read-only', tooltip: 'Workspace is read-only', iconName: 'eye' }),
    !!props.workspaceProtectedMessage &&
      h(Notice, { label: protectedDataLabel, tooltip: props.workspaceProtectedMessage, iconName: protectedDataIcon }),
    !!props.workspaceRegionConstraintMessage &&
      h(Notice, { label: regionConstraintLabel, tooltip: props.workspaceRegionConstraintMessage, iconName: 'globe' }),
  ]);
};

interface NoticeProperties {
  label: string;
  tooltip: string;
  iconName: IconId;
}

const Notice = (props: NoticeProperties) => {
  return span(
    {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        height: '2rem',
        padding: '0 1rem',
        borderRadius: '1rem',
        marginRight: '1rem',
        backgroundColor: colors.dark(0.15),
        textTransform: 'none',
      },
    },
    [
      h(
        TooltipTrigger,
        {
          content: [div({ key: props.label, style: { maxWidth: 300 } }, [props.tooltip])],
        },
        [icon(props.iconName, { size: 20, 'aria-label': props.label })]
      ),
    ]
  );
};
