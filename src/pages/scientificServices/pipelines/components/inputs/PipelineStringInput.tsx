import React from 'react';
import { TextInput } from 'src/components/input';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { INPUT_DESCRIPTIONS } from 'src/pages/scientificServices/pipelines/components/inputs/input-utils';

interface PipelineStringInputProps {
  input: PipelineInput;
  value: string;
  onChange: (value: string) => void;
}

export const PipelineStringInput: React.FC<PipelineStringInputProps> = ({ input, value, onChange }) => {
  return (
    <>
      <h3 style={{ marginBottom: '0.5rem' }}>
        {INPUT_DESCRIPTIONS[input.name]} {input.isRequired ? <span style={{ color: '#DB3214' }}>*</span> : null}
      </h3>
      <TextInput
        aria-label='output file prefix'
        type='text'
        value={value}
        placeholder='Enter prefix name'
        style={{ width: 400 }}
        onChange={onChange}
      />
      <div style={{ marginTop: '0.5rem', marginBottom: '2rem', fontStyle: 'italic' }}>
        May only contain alphanumeric characters, dashes, and underscores.
      </div>
    </>
  );
};
