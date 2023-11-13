import React, { ReactNode } from 'react';
import { LabeledCheckbox } from 'src/components/common';

interface CommunicationPreferencesCheckboxProps {
  title: string;
  value: boolean;
  onChange?: (value: boolean) => void;
}

export const CommunicationPreferencesCheckbox = (props: CommunicationPreferencesCheckboxProps): ReactNode => {
  const { title, value, onChange } = props;
  return (
    <div style={{ marginTop: '.25rem' }}>
      <LabeledCheckbox checked={value} disabled={onChange === undefined} onChange={onChange}>
        <span style={{ marginLeft: '0.5rem' }}>{title}</span>
      </LabeledCheckbox>
    </div>
  );
};
