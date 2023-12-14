import { CSSProperties, ReactNode } from 'react';
import { div, h, h3 } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import { useLocalPref } from 'src/libs/useLocalPref';

interface RightBoxSectionProps {
  title: string;
  info?: ReactNode;
  afterTitle?: ReactNode;
  persistenceId: string; // persists whether or not the panel is open in local storage
  defaultPanelOpen?: boolean; // optional default for the panel state - false if not specifified
  children?: ReactNode;
}

export const RightBoxSection = (props: RightBoxSectionProps): ReactNode => {
  const { title, info, persistenceId, afterTitle, defaultPanelOpen = false, children } = props;
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
          onClick: () => setPanelOpen(!panelOpen),
        },
        [children]
      ),
    ]),
  ]);
};
