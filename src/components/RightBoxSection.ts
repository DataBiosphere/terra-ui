import { CSSProperties, ReactNode } from 'react';
import { div, h, h3 } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

export type RightBoxSectionProps = {
  title: string;
  info?: ReactNode;
  afterTitle?: ReactNode;
  children?: ReactNode;
  persistenceId: string; // persists whether or not the panel is open in local storage
  defaultPanelOpen?: boolean; // optional default for the panel state - false if not specified
  fnCallback?: () => void;
  panelOpen?: boolean;
  setPanelOpen: (b: boolean) => void;
};

export const RightBoxSection = (props: RightBoxSectionProps): ReactNode => {
  const { title, children, afterTitle, info, fnCallback, panelOpen, setPanelOpen } = props;

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
            if (fnCallback) {
              fnCallback();
            }
          },
        },
        [children]
      ),
    ]),
  ]);
};
