import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';

interface NewGroupCardProps {
  onClick: () => void;
}

export const NewGroupCard = (props: NewGroupCardProps): ReactNode => (
  <ButtonPrimary style={{ textTransform: 'none' }} onClick={props.onClick}>
    <Icon icon='plus' size={14} />
    <div style={{ marginLeft: '0.5rem' }}>Create a New Group</div>
  </ButtonPrimary>
);
