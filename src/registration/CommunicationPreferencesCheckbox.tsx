import React from 'react';
import { LabeledCheckbox } from 'src/components/common';

interface CommunicationPreferencesCheckboxProps {
  title: string;
  value: boolean;
  setFunc: React.Dispatch<React.SetStateAction<boolean>> | undefined;
}

export const CommunicationPreferencesCheckbox = (props: CommunicationPreferencesCheckboxProps) => (
  <div style={{ marginTop: '.25rem' }}>
    <LabeledCheckbox checked={props.value} disabled={props.setFunc === undefined} onChange={props.setFunc}>
      <span style={{ marginLeft: '0.5rem' }}>{props.title}</span>
    </LabeledCheckbox>
  </div>
);
