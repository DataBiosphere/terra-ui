import { Spinner, SpinnerProps } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';

export { icon } from '@terra-ui-packages/components';

export const spinner = (props: SpinnerProps = {}): ReactNode => {
  return h(Spinner, props);
};

export const centeredSpinner = ({ size = 48, ...props }: SpinnerProps = {}): ReactNode =>
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
