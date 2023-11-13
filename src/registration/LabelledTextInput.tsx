import { useUniqueId } from '@terra-ui-packages/components';
import React, { CSSProperties } from 'react';
import { TextInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';

interface LabelledTextInputProps {
  disabled?: boolean;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  labelStyle?: CSSProperties;
  inputStyle?: CSSProperties;
  label: string;
}
export const LabelledTextInput = (props: LabelledTextInputProps) => {
  const { disabled, required, value, onChange, labelStyle, inputStyle, label } = props;
  const id = useUniqueId();
  return (
    <div style={{ marginRight: '1rem' }}>
      <FormLabel htmlFor={id} required={required} style={labelStyle}>
        {label}
      </FormLabel>
      <TextInput id={id} required={required} disabled={disabled} value={value} onChange={onChange} style={inputStyle} />
    </div>
  );
};
