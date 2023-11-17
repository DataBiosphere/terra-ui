import { ReactNode } from 'react';

import iconLibrary, { IconId } from './icon-library';

type SvgProps = JSX.IntrinsicElements['svg'];

export interface IconProps extends SvgProps {
  color?: string;
  size?: number;
}

/**
 * Renders an icon.
 * @param shape - The icon to render.
 * @param props - Props for the icon component.
 */
export const icon = (shape: IconId, props?: IconProps): ReactNode => {
  const { size = 16, ...otherProps } = props || {};

  const renderIcon = iconLibrary[shape];
  return renderIcon({
    ...otherProps,
    size,
    // Unless we have a label, we need to hide the icon from screen readers
    'aria-hidden': !otherProps['aria-label'] && !otherProps['aria-labelledby'],
    'data-icon': shape,
  });
};
