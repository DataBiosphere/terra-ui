import { Spinner, SpinnerProps } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { CSSProperties, ReactNode } from 'react';

export { icon } from '@terra-ui-packages/components';

export const centeredSpinner = (props: SpinnerProps = {}): ReactNode => {
  const { size = 48, ...rest } = props;
  const mergedProps = _.merge(
    {
      size,
      style: {
        display: 'block',
        position: 'sticky',
        top: `calc(50% - ${size / 2}px)`,
        bottom: `calc(50% - ${size / 2}px)`,
        left: `calc(50% - ${size / 2}px)`,
        right: `calc(50% - ${size / 2}px)`,
      } as CSSProperties,
    },
    rest
  );

  return <Spinner {...mergedProps} />;
};
