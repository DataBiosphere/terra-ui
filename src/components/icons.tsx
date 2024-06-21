// pass-thru to be removed later.
import { CenteredSpinner, SpinnerProps } from '@terra-ui-packages/components';
import React from 'react';

export { icon } from '@terra-ui-packages/components';

export const centeredSpinner = (props: SpinnerProps = {}) => {
  return <CenteredSpinner {...props} />;
};
