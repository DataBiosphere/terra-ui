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

const WorkspaceAttributeNotice = ({
  accessLevel,
  isLocked,
  workspaceProtectedMessage,
}: WorkspaceAttributeNoticeProperties) => {
  const isReadOnly = !Utils.canWrite(accessLevel);

  return div({}, [
    isLocked && h(Notice, { label: 'Locked', tooltip: 'Workspace is locked', iconName: 'lock' }),
    isReadOnly && h(Notice, { label: 'Read-only', tooltip: 'Workspace is read-only', iconName: 'eye' }),
    !!workspaceProtectedMessage &&
      h(Notice, { label: 'Protected', tooltip: workspaceProtectedMessage, iconName: 'shield' }),
    // TODO: ticket
    // isRegionLimited && h(Notice,{label: 'Region-limited', tooltip: getRegionTooltip(), iconName: 'globe'}),
  ]);
};

interface NoticeProperties {
  label: string;
  tooltip: string;
  iconName: string;
}

const Notice = ({ label, tooltip, iconName }: NoticeProperties) => {
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
          content: [div({ key: label }, [tooltip])],
        },
        [icon(iconName, { size: 20, 'aria-label': label })]
      ),
    ]
  );
};

export default WorkspaceAttributeNotice;
