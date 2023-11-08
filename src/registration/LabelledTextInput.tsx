import { useUniqueId } from '@terra-ui-packages/components';
import React from 'react';
import { TextInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';

interface LabelledTextInputProps {
  disabled?: boolean;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  labelStyle?: object;
  inputStyle?: object;
  label: string;
}
export const LabelledTextInput = (props: LabelledTextInputProps) => {
  const id = useUniqueId();
  return (
    <div>
      <FormLabel htmlFor={id} required={props.required} style={props.labelStyle}>
        {props.label}
      </FormLabel>
      <TextInput
        id={id}
        required={props.required}
        disabled={props.disabled}
        value={props.value}
        onChange={props.onChange}
        style={props.inputStyle}
      />
    </div>
  );
};
