import { div, h } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import { wdlIcon } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

export const MethodCard = ({ method, ...props }) => {
  return h(
    Clickable,
    {
      ...props,
      style: {
        ...Style.elements.card.container,
        backgroundColor: 'white',
        width: 445,
        height: 140,
        padding: undefined,
        margin: '0 30px 27px 0',
        position: 'relative',
      },
    },
    [
      div({ style: { flex: 'none', padding: '15px 20px', height: 140 } }, [
        div({ style: { color: colors.accent(), fontSize: 16, lineHeight: '20px', height: 40, marginBottom: 7 } }, [method.method_name]),
        div({ style: { lineHeight: '20px', ...Style.noWrapEllipsis, whiteSpace: 'pre-wrap', height: 60 } }, [method.method_description]),
      ]),
      wdlIcon({ style: { position: 'absolute', top: 0, right: 8 } }),
    ]
  );
};
