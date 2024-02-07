import { PropsWithChildren } from 'react';
import { div, HTMLElementProps } from 'react-hyperscript-helpers';
import { styles } from 'src/billing/NewBillingProjectWizard/GCPBillingProjectWizard/GCPBillingProjectWizard';
import { RadioButton } from 'src/components/common';

interface LabeledProps extends HTMLElementProps<'input'> {
  text: string;
  name: string;
  labelStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}

export const LabeledRadioButton = ({ text, name, labelStyle, style, ...props }: LabeledProps) =>
  div({ style: { display: 'flex', flexDirection: 'row', margin: '.25rem', ...style } }, [
    RadioButton({
      text,
      name,
      labelStyle: { ...styles.radioButtonLabel, ...labelStyle },
      ...props,
    }),
  ]);

type LabeledRadioGroupProps = PropsWithChildren<{
  style?: React.CSSProperties;
}>;

export const LabeledRadioGroup = ({ style, children }: LabeledRadioGroupProps) =>
  div(
    {
      style: {
        display: 'flex',
        margin: '1rem',
        flexDirection: 'column',
        justifyContent: 'space-around',
        ...style,
      },
      role: 'radiogroup',
    },
    [children]
  );
