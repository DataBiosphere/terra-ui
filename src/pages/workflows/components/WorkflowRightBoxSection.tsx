import React, { CSSProperties, ReactNode } from 'react';
import Collapse from 'src/components/Collapse';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

interface WorkflowRightBoxSectionProps {
  children?: ReactNode;
  title: string;
  info: string;
  panelOpen: boolean;
}

export const WorkflowRightBoxSection = (props: WorkflowRightBoxSectionProps) => {
  const { children, title, info, panelOpen } = props;
  return (
    <div style={{ paddingTop: '1rem' }}>
      <div style={Style.dashboard.rightBoxContainer}>
        <Collapse
          title={titleElement(title, info)}
          summaryStyle={colors.accent()}
          initialOpenState={panelOpen}
          titleFirst
        >
          {children}
        </Collapse>
      </div>
    </div>

    // div({ style: { paddingTop: '1rem' } }, [
    //   div({ style: Style.dashboard.rightBoxContainer }, [
    //     h(
    //         Collapse,
    //         {
    //           title: h3({ style: Style.dashboard.collapsibleHeader as CSSProperties }, [title, info]),
    //           summaryStyle: { color: colors.accent() },
    //           initialOpenState: panelOpen,
    //           titleFirst: true,
    //           afterTitle,
    //           onOpenChanged: (panelOpen) => {
    //             setPanelOpen(panelOpen);
    //             Ajax().Metrics.captureEvent(Events.workspaceDashboardToggleSection, {
    //               title,
    //               opened: panelOpen,
    //               ...extractWorkspaceDetails(workspace),
    //             });
    //           },
    //         },
    //         [children]
    //     ),
    //   ]),
    // ]);
  );
};

const titleElement = (title, info) => {
  return (
    <h3 style={Style.dashboard.collapsibleHeader as CSSProperties}>
      {title}
      {info}
    </h3>
  );
};
