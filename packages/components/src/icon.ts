import { CSSProperties, ReactNode } from 'react';

import iconLibrary, { IconId } from './icon-library';

export interface IconProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  size?: number;
  style?: CSSProperties;
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
