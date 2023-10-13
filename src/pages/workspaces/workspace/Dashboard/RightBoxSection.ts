import { CSSProperties, ReactNode } from 'react';
import { div, h, h3 } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

interface RightBoxSectionProps {
  title: string;
  info?: ReactNode;
  initialOpenState: boolean;
  afterTitle?: ReactNode;
  onClick: () => void;
  children?: ReactNode;
}

export const RightBoxSection = (props: RightBoxSectionProps): ReactNode => {
  const { title, info, initialOpenState, afterTitle, onClick, children } = props;
  return div({ style: { paddingTop: '1rem' } }, [
    div({ style: Style.dashboard.rightBoxContainer }, [
      h(
        Collapse,
        {
          title: h3({ style: Style.dashboard.collapsibleHeader as CSSProperties }, [title, info]),
          summaryStyle: { color: colors.accent() },
          initialOpenState,
          titleFirst: true,
          afterTitle,
          onClick,
        },
        [children]
      ),
    ]),
  ]);
};
