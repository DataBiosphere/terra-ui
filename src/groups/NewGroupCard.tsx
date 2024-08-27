import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary } from 'src/components/common';
import { icon } from 'src/components/icons';

export const NewGroupCard = ({ onClick }) => {
  return h(
    ButtonPrimary,
    {
      style: { textTransform: 'none' },
      onClick,
    },
    [icon('plus', { size: 14 }), div({ style: { marginLeft: '0.5rem' } }, ['Create a New Group'])]
  );
};
