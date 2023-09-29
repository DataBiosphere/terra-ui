import { DelayedRender, icon, IconProps } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, ReactNode } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';

export { icon } from '@terra-ui-packages/components';

export interface SpinnerOptions extends IconProps {
  message?: string;
}

export const spinner = ({ message = 'Loading', ...props }: SpinnerOptions = {}): ReactNode =>
  h(Fragment, [
    icon('loadingSpinner', _.merge({ size: 24, style: { color: colors.primary() } }, props)),
    h(DelayedRender, { delay: 150 }, [span({ className: 'sr-only', role: 'alert' }, [message])]),
  ]);

export const centeredSpinner = ({ size = 48, ...props }: SpinnerOptions = {}): ReactNode =>
  spinner(
    _.merge(
      {
        size,
        style: {
          display: 'block',
          position: 'sticky',
          top: `calc(50% - ${size / 2}px)`,
          bottom: `calc(50% - ${size / 2}px)`,
          left: `calc(50% - ${size / 2}px)`,
          right: `calc(50% - ${size / 2}px)`,
        },
      },
      props
    )
  );

export const wdlIcon = ({ style = {}, ...props }: JSX.IntrinsicElements['div'] = {}): ReactNode =>
  div(
    {
      style: {
        color: 'white',
        fontSize: 6,
        fontWeight: 'bold',
        backgroundColor: colors.dark(),
        padding: '10px 2px 3px 2px',
        ...style,
      },
      ...props,
    },
    ['WDL']
  );
