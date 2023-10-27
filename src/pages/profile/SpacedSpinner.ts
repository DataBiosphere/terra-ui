import { Spinner } from '@terra-ui-packages/components';
import { div, h } from 'react-hyperscript-helpers';

export const SpacedSpinner = ({ children }) => {
  return div({ style: { display: 'flex', alignItems: 'center' } }, [
    h(Spinner, { style: { marginRight: '1rem' } }),
    children,
  ]);
};
