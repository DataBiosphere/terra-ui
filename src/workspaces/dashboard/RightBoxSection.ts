import { CSSProperties, ReactNode } from 'react';
import { div, h, h3 } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Style from 'src/libs/style';
import { useLocalPref } from 'src/libs/useLocalPref';
import { WorkspaceWrapper } from 'src/workspaces/utils';

interface WorkspaceRightSectionProps {
  workspace: WorkspaceWrapper; // used for metrics eventing
}

export type RightBoxSectionProps = {
  workspaceProps?: WorkspaceRightSectionProps;
  title: string;
  info?: ReactNode;
  afterTitle?: ReactNode;
  children?: ReactNode;
  persistenceId: string; // persists whether or not the panel is open in local storage
  defaultPanelOpen?: boolean; // optional default for the panel state - false if not specified
};

export const RightBoxSection = (props: RightBoxSectionProps): ReactNode => {
  const workspace = props.workspaceProps ? props.workspaceProps.workspace : undefined;

  const { title, children, defaultPanelOpen, persistenceId, afterTitle, info } = props;
  const [panelOpen, setPanelOpen] = useLocalPref<boolean>(persistenceId, defaultPanelOpen);
  return div({ style: { paddingTop: '1rem' } }, [
    div({ style: Style.dashboard.rightBoxContainer }, [
      h(
        Collapse,
        {
          title: h3({ style: Style.dashboard.collapsibleHeader as CSSProperties }, [title, info]),
          summaryStyle: { color: colors.accent() },
          initialOpenState: panelOpen,
          titleFirst: true,
          afterTitle,
          onOpenChanged: (panelOpen) => {
            if (workspace) {
              setPanelOpen(panelOpen);
              Ajax().Metrics.captureEvent(Events.workspaceDashboardToggleSection, {
                title,
                opened: panelOpen,
                ...extractWorkspaceDetails(workspace),
              });
            }
          },
        },
        [children]
      ),
    ]),
  ]);
};
