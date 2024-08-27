import { useCallback } from 'react';
import { h } from 'react-hyperscript-helpers';
import { RightBoxSection, RightBoxSectionProps } from 'src/components/RightBoxSection';
import { Ajax } from 'src/libs/ajax';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { useLocalPref } from 'src/libs/useLocalPref';
import { WorkspaceWrapper } from 'src/workspaces/utils';

interface WorkspaceRightBoxSectionProps extends RightBoxSectionProps {
  workspace: WorkspaceWrapper; // used for metrics eventing
}

export const WorkspaceRightBoxSection = (props: WorkspaceRightBoxSectionProps) => {
  const { workspace, title, persistenceId, defaultPanelOpen, afterTitle, info, children } = props;
  const [panelOpen, setPanelOpen] = useLocalPref<boolean>(persistenceId, defaultPanelOpen);

  const workspaceDashboardToggle = useCallback(() => {
    Ajax().Metrics.captureEvent(Events.workspaceDashboardToggleSection, {
      title,
      opened: panelOpen,
      ...extractWorkspaceDetails(workspace),
    });
  }, [panelOpen, title, workspace]);

  return h(
    RightBoxSection,
    {
      panelOpen,
      setPanelOpen,
      title,
      persistenceId,
      fnCallback: () => workspaceDashboardToggle(),
      afterTitle,
      info,
    },
    [children]
  );
};
