import { div } from 'react-hyperscript-helpers';
import { spinner } from 'src/components/icons';

export const SpacedSpinner = ({ children }) => {
  return div({ style: { display: 'flex', alignItems: 'center' } }, [
    spinner({ style: { marginRight: '1rem' } }),
    children,
  ]);
};
