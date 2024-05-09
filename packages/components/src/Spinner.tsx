import { ReactNode } from 'react';

import { DelayedRender } from './DelayedRender';
import { icon, IconProps } from './icon';
import { visuallyHidden } from './styles';
import { useThemeFromContext } from './theme';

export interface SpinnerProps extends IconProps {
  /** Message to announce to screen reader users. */
  message?: string;
}

/**
 * Renders a spinner and an alert for screen reader users.
 */
export const Spinner = (props: SpinnerProps): ReactNode => {
  const { message = 'Loading', style, ...otherProps } = props;

  const { colors } = useThemeFromContext();

  return (
    <>
      {icon('loadingSpinner', { size: 24, style: { color: colors.primary(), ...style }, ...otherProps })}
      <DelayedRender delay={150}>
        <span role='alert' style={visuallyHidden}>
          {message}
        </span>
      </DelayedRender>
    </>
  );
};
