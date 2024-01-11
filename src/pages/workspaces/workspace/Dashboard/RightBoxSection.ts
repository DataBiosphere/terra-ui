import { CSSProperties, ReactNode } from 'react';
import { div, h, h3 } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Style from 'src/libs/style';
import { useLocalPref } from 'src/libs/useLocalPref';
import { InitializedWorkspaceWrapper as Workspace } from 'src/pages/workspaces/hooks/useWorkspace';

interface RightBoxSectionProps {
  title: string;
  workspace: Workspace; // used for metrics eventing
  info?: ReactNode;
  afterTitle?: ReactNode;
  persistenceId: string; // persists whether or not the panel is open in local storage
  defaultPanelOpen?: boolean; // optional default for the panel state - false if not specifified
  children?: ReactNode;
}

export const RightBoxSection = (props: RightBoxSectionProps): ReactNode => {
  const { title, info, persistenceId, afterTitle, defaultPanelOpen = false, children, workspace } = props;
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
            setPanelOpen(panelOpen);
            Ajax().Metrics.captureEvent(Events.workspaceDashboardSectionToggle, {
              title,
              opened: panelOpen,
              ...extractWorkspaceDetails(workspace),
            });
          },
        },
        [children]
      ),
    ]),
  ]);
};
