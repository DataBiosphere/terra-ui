import React from 'react';
import { ValidatedInput } from 'src/components/input';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { INPUT_DESCRIPTIONS } from 'src/pages/scientificServices/pipelines/utils/input-utils';

interface PipelineStringInputProps {
  input: PipelineInput;
  value: string;
  onChange: (value: string) => void;
  validationError?: string;
  onValidation(error?: string): void;
}

export const PipelineStringInput: React.FC<PipelineStringInputProps> = ({
  input,
  value,
  onChange,
  validationError,
  onValidation,
}) => {
  const { label, placeholder, helpText, validationRegex } = INPUT_DESCRIPTIONS[input.name] || {};

  return (
    <>
      <h3 style={{ marginBottom: '0.5rem' }}>
        {label || input.name} {input.isRequired ? <span style={{ color: '#DB3214' }}>*</span> : null}
      </h3>
      <ValidatedInput
        width={400}
        error={validationError}
        inputProps={{
          'aria-label': `${input.name} text input`,
          type: 'text',
          value: value || '',
          placeholder: placeholder || '',
          onChange: (e) => {
            onChange(e);
            if (validationRegex) {
              const regex = new RegExp(validationRegex);
              if (!regex.test(e.trim()) && e.length > 0) {
                onValidation('This input contains invalid characters');
              } else {
                onValidation(undefined);
              }
            }
          },
        }}
      />
      {helpText && <div style={{ marginTop: '0.5rem', marginBottom: '2rem', fontStyle: 'italic' }}>{helpText}</div>}
    </>
  );
};
