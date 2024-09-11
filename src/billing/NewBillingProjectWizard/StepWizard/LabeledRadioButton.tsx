import React, { PropsWithChildren } from 'react';
import { styles } from 'src/billing/NewBillingProjectWizard/GCPBillingProjectWizard/GCPBillingProjectWizard';
import { RadioButton } from 'src/components/common';

interface LabeledProps extends React.HTMLProps<HTMLInputElement> {
  text: string;
  name: string;
  labelStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}

export const LabeledRadioButton = ({ text, name, labelStyle, style, ...props }: LabeledProps) => (
  <div style={{ display: 'flex', flexDirection: 'row', margin: '.25rem', ...style }}>
    <RadioButton text={text} name={name} labelStyle={{ ...styles.radioButtonLabel, ...labelStyle }} {...props} />
  </div>
);

type LabeledRadioGroupProps = PropsWithChildren<{
  style?: React.CSSProperties;
}>;

export const LabeledRadioGroup = ({ style, children }: LabeledRadioGroupProps) => (
  <div
    style={{
      display: 'flex',
      margin: '1rem',
      flexDirection: 'column',
      justifyContent: 'space-around',
      ...style,
    }}
    role='radiogroup'
  >
    {children}
  </div>
);
