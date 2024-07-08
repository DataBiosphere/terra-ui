import { injectStyle } from '@terra-ui-packages/components';
import { CSSProperties, ReactNode } from 'react';
import { div, h, p } from 'react-hyperscript-helpers';

type DivProps = JSX.IntrinsicElements['div'];

export interface TerraHexagonsAnimationProps extends DivProps {
  size?: number;
}

injectStyle(`
@keyframes terraRockingHexagon {
  from {
    transform: rotate(-20deg);
  }
  to {
    transform: rotate(10deg);
  }
}
`);

const hexStyle: CSSProperties = {
  position: 'absolute',
  borderRadius: '100%',
  animation: 'terraRockingHexagon .9s ease-in-out infinite',
  clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
  rotate: '90deg',
};

export const TerraHexagonsAnimation = (props: TerraHexagonsAnimationProps): ReactNode => {
  const { children, size = 125, style, ...otherProps } = props;

  return div(
    {
      ...otherProps,
      style: {
        ...style,
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: size,
      },
    },
    [
      div({
        style: {
          ...hexStyle,
          height: size,
          width: size,
          backgroundColor: '#359348',
          animationDirection: 'alternate-reverse',
        },
      }),

      div({
        style: {
          ...hexStyle,
          height: size * 0.825,
          width: size * 0.825,
          backgroundColor: '#73ad43',
          animationDirection: 'alternate',
        },
      }),

      div({
        style: {
          ...hexStyle,
          height: size * 0.65,
          width: size * 0.65,
          backgroundColor: '#afd139',
          animationDirection: 'alternate-reverse',
        },
      }),

      !!children &&
        div(
          {
            style: {
              // Position children above the hexagons.
              // z-index is necessary here because the hexagons have clip-path and transform styles
              // which create new stacking contexts.
              zIndex: 1,
              color: '#3b5822',
              fontWeight: 'bold',
            },
          },
          [children]
        ),
    ]
  );
};

export interface TerraHexagonsAnimationOverlayProps extends TerraHexagonsAnimationProps {
  message: string;
}

export const TerraHexagonsAnimationOverlay = (props: TerraHexagonsAnimationOverlayProps): ReactNode => {
  const { message, ...otherProps } = props;
  return div(
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
      ...otherProps,
    },
    [
      h(TerraHexagonsAnimation, { 'aria-hidden': true, size: 150, style: { margin: '2rem 0' } }, [
        div({ style: { color: '#225C00', fontWeight: 'bold' } }, ['Loading...']),
      ]),
      div({ role: 'alert', style: { marginBottom: '2rem', textAlign: 'center' } }, [
        p({ style: { fontWeight: 'bold' } }, ['Please stand by...']),
        p([message]),
        p(['This may take a few minutes.']),
      ]),
    ]
  );
};
