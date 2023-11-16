import React, { ReactNode } from 'react';
import { LabeledCheckbox } from 'src/components/common';

interface RegistrationPageCheckboxProps {
  title: string;
  checked: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}

export const RegistrationPageCheckbox = (props: RegistrationPageCheckboxProps): ReactNode => {
  const { title, checked, onChange, disabled } = props;
  return (
    <div style={{ marginTop: '.25rem' }}>
      <LabeledCheckbox checked={checked} disabled={disabled || onChange === undefined} onChange={onChange}>
        <span style={{ marginLeft: '0.5rem' }}>{title}</span>
      </LabeledCheckbox>
    </div>
  );
};
