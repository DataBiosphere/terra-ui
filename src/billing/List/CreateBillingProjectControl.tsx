import { ButtonOutline, Icon } from '@terra-ui-packages/components';
import React from 'react';
import { CloudProvider } from 'src/workspaces/utils';

interface CreateBillingProjectControlProps {
  showCreateProjectModal: (type: CloudProvider) => void;
}

export const CreateBillingProjectControl = (props: CreateBillingProjectControlProps) => {
  return (
    <ButtonOutline aria-label='Create new billing project' onClick={() => props.showCreateProjectModal('GCP')}>
      <span>
        <Icon icon='plus-circle' style={{ marginRight: '1ch' }} />
        Create
      </span>
    </ButtonOutline>
  );
};
