import React, { useCallback } from 'react';
import { RightBoxSection, RightBoxSectionProps } from 'src/components/RightBoxSection';
import { Metrics } from 'src/libs/ajax/Metrics';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { WorkspaceWrapper } from 'src/workspaces/utils';

interface WorkspaceRightBoxSectionProps extends RightBoxSectionProps {
  workspace: WorkspaceWrapper; // used for metrics eventing
}

export const WorkspaceRightBoxSection = (props: WorkspaceRightBoxSectionProps) => {
  const { workspace, title, persistenceId, defaultPanelOpen, afterTitle, info, children } = props;

  const workspaceDashboardToggle = useCallback(
    (panelOpen: boolean) => {
      void Metrics().captureEvent(Events.workspaceDashboardToggleSection, {
        title,
        opened: panelOpen,
        ...extractWorkspaceDetails(workspace),
      });
    },
    [title, workspace]
  );

  return (
    <RightBoxSection
      title={title}
      persistenceId={persistenceId}
      defaultPanelOpen={defaultPanelOpen}
      onOpenChangedCallback={(panelOpen: boolean) => workspaceDashboardToggle(panelOpen)}
      afterTitle={afterTitle}
      info={info}
    >
      {children}
    </RightBoxSection>
  );
};
