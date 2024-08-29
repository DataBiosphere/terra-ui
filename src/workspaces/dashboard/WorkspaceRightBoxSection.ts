import { useCallback } from 'react';
import { h } from 'react-hyperscript-helpers';
import { RightBoxSection, RightBoxSectionProps } from 'src/components/RightBoxSection';
import { Ajax } from 'src/libs/ajax';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { WorkspaceWrapper } from 'src/workspaces/utils';

interface WorkspaceRightBoxSectionProps extends RightBoxSectionProps {
  workspace: WorkspaceWrapper; // used for metrics eventing
}

export const WorkspaceRightBoxSection = (props: WorkspaceRightBoxSectionProps) => {
  const { workspace, title, persistenceId, defaultPanelOpen, afterTitle, info, children } = props;

  const workspaceDashboardToggle = useCallback(
    (panelOpen: boolean) => {
      Ajax().Metrics.captureEvent(Events.workspaceDashboardToggleSection, {
        title,
        opened: panelOpen,
        ...extractWorkspaceDetails(workspace),
      });
    },
    [title, workspace]
  );

  return h(
    RightBoxSection,
    {
      title,
      persistenceId,
      defaultPanelOpen,
      onOpenChangedCallback: (panelOpen: boolean) => workspaceDashboardToggle(panelOpen),
      afterTitle,
      info,
    },
    [children]
  );
};
