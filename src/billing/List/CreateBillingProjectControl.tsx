import { ButtonOutline, Icon } from '@terra-ui-packages/components';
import React from 'react';
import { MenuButton } from 'src/components/MenuButton';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { CloudProvider } from 'src/workspaces/utils';

interface CreateBillingProjectControlProps {
  showCreateProjectModal: (type: CloudProvider) => void;
}

export const CreateBillingProjectControl = (props: CreateBillingProjectControlProps) => {
  return (
    <MenuTrigger
      side='bottom'
      closeOnClick
      content={
        <>
          <MenuButton aria-haspopup='dialog' onClick={() => props.showCreateProjectModal('AZURE')}>
            Azure Billing Project
          </MenuButton>
          <MenuButton aria-haspopup='dialog' onClick={() => props.showCreateProjectModal('GCP')}>
            GCP Billing Project
          </MenuButton>
        </>
      }
    >
      <ButtonOutline aria-label='Create new billing project'>
        <span>
          <Icon icon='plus-circle' style={{ marginRight: '1ch' }} />
          Create
        </span>
      </ButtonOutline>
    </MenuTrigger>
  );
};
