import React from 'react';
import { ValidatedInput } from 'src/components/input';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { INPUT_DESCRIPTIONS } from 'src/pages/scientificServices/pipelines/utils/pipeline-input-utils';

interface PipelineFloatInputProps {
  input: PipelineInput;
  value: string;
  onChange: (value: string) => void;
  validationError?: string;
  onValidation(error?: string): void;
}

export const PipelineFloatInput: React.FC<PipelineFloatInputProps> = ({
  input,
  value,
  onChange,
  validationError,
  onValidation,
}) => {
  const { label, placeholder, helpText } = INPUT_DESCRIPTIONS[input.name];

  return (
    <>
      <h3 style={{ marginBottom: '0.5rem' }}>
        {label || input.name}{' '}
        {input.isRequired ? (
          <span style={{ color: '#DB3214' }}>*</span>
        ) : (
          <span style={{ fontStyle: 'italic', fontWeight: 'normal' }}> - optional</span>
        )}
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
            // Regex to match valid floating-point numbers, including integers and decimals
            const floatRegex = /^[+-]?(?:\d*\.\d+|\d+\.?\d*)$/;
            if (!floatRegex.test(e.trim()) && e.length > 0) {
              onValidation('Invalid float value');
            } else {
              onValidation(undefined);
            }
          },
        }}
      />
      {helpText && <div style={{ marginTop: '0.5rem', marginBottom: '2rem', fontStyle: 'italic' }}>{helpText}</div>}
    </>
  );
};
