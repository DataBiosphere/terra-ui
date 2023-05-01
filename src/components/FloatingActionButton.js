import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

const FloatingActionButton = ({ label, iconShape, onClick, bottom = 30, right = 30 }) => {
  const [hover, setHover] = useState(false);

  return h(
    Clickable,
    {
      style: {
        position: 'absolute',
        bottom,
        right,
        backgroundColor: colors.accent(),
        color: 'white',
        padding: '0.5rem',
        borderRadius: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: Style.standardShadow,
      },
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      onFocus: () => setHover(true),
      onBlur: () => setHover(false),
      onClick: () => {
        onClick();
        setHover(false);
      },
    },
    [
      div(
        {
          style: {
            padding: `0 ${hover ? '0.5rem' : '0'}`,
            fontWeight: 'bold',
            maxWidth: hover ? 200 : 0,
            overflow: 'hidden',
            whiteSpace: 'pre',
            transition: 'max-width 0.5s ease-out, padding 0.1s linear 0.2s',
          },
        },
        label
      ),
      icon(iconShape, { size: 25, style: { stroke: 'white', strokeWidth: 2 } }),
    ]
  );
};

export default FloatingActionButton;
