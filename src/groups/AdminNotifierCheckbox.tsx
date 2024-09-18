import React, { ReactNode } from 'react';
import { LabeledCheckbox } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';

interface AdminNotifierCheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export const AdminNotifierCheckbox = (props: AdminNotifierCheckboxProps): ReactNode => (
  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
    <LabeledCheckbox style={{ marginRight: '0.25rem' }} checked={props.checked} onChange={props.onChange}>
      Allow anyone to request access
    </LabeledCheckbox>
    <InfoBox style={{ marginLeft: '0.3rem' }}>
      Any user will be able to request to become a member of this group. This will send an email to the group admins.
    </InfoBox>
  </div>
);
