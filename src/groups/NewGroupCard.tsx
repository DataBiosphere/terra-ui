import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import React from 'react';

export const NewGroupCard = ({ onClick }) => (
  <ButtonPrimary style={{ textTransform: 'none' }} onClick={onClick}>
    <Icon icon='plus' size={14} />
    <div style={{ marginLeft: '0.5rem' }}>Create a New Group</div>
  </ButtonPrimary>
);
