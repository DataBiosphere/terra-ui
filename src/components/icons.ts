import { Spinner, SpinnerProps } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';

export { icon } from '@terra-ui-packages/components';

export const centeredSpinner = ({ size = 48, ...props }: SpinnerProps = {}): ReactNode =>
  h(
    Spinner,
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
