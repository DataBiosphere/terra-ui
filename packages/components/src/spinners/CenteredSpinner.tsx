import _ from 'lodash/fp';
import React, { CSSProperties, ReactNode } from 'react';

import { Spinner, SpinnerProps } from './Spinner';

export const CenteredSpinner = (props: SpinnerProps = {}): ReactNode => {
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
      } satisfies CSSProperties,
    },
    rest
  );

  return <Spinner {...mergedProps} />;
};
