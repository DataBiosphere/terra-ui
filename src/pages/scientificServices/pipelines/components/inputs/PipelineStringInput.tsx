import React from 'react';
import { TextInput } from 'src/components/input';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { INPUT_DESCRIPTIONS } from 'src/pages/scientificServices/pipelines/utils/input-utils';

interface PipelineStringInputProps {
  input: PipelineInput;
  value: string;
  onChange: (value: string) => void;
}

export const PipelineStringInput: React.FC<PipelineStringInputProps> = ({ input, value, onChange }) => {
  const { label, placeholder, helpText } = INPUT_DESCRIPTIONS[input.name];

  return (
    <>
      <h3 style={{ marginBottom: '0.5rem' }}>
        {label || input.name} {input.isRequired ? <span style={{ color: '#DB3214' }}>*</span> : null}
      </h3>
      <TextInput
        aria-label={`${input.name} text input`}
        type='text'
        value={value || ''}
        placeholder={placeholder || ''}
        style={{ width: 400 }}
        onChange={onChange}
      />
      {helpText && <div style={{ marginTop: '0.5rem', marginBottom: '2rem', fontStyle: 'italic' }}>{helpText}</div>}
    </>
  );
};
