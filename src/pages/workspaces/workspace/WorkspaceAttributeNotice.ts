import { div, h, span } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import TooltipTrigger from 'src/components/TooltipTrigger';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import { WorkspaceAccessLevel } from 'src/libs/workspace-utils';

interface WorkspaceAttributeNoticeProperties {
  accessLevel: WorkspaceAccessLevel;
  isLocked: boolean;
  workspaceProtectedMessage?: string;
}

const WorkspaceAttributeNotice = (props: WorkspaceAttributeNoticeProperties) => {
  const isReadOnly = !Utils.canWrite(props.accessLevel);

  return div({}, [
    props.isLocked && h(Notice, { label: 'Locked', tooltip: 'Workspace is locked', iconName: 'lock' }),
    isReadOnly && h(Notice, { label: 'Read-only', tooltip: 'Workspace is read-only', iconName: 'eye' }),
    !!props.workspaceProtectedMessage &&
      h(Notice, { label: 'Protected', tooltip: props.workspaceProtectedMessage, iconName: 'shield' }),
    // Will be used in WOR-1243
    // isRegionLimited && h(Notice,{label: 'Region-limited', tooltip: getRegionTooltip(), iconName: 'globe'}),
  ]);
};

interface NoticeProperties {
  label: string;
  tooltip: string;
  iconName: string;
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
          content: [div({ key: props.label }, [props.tooltip])],
        },
        [icon(props.iconName, { size: 20, 'aria-label': props.label })]
      ),
    ]
  );
};

export default WorkspaceAttributeNotice;
