import React from 'react';
import { NumberInput } from 'src/components/input';
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
  const { label, placeholder, helpText, validationRegex } = INPUT_DESCRIPTIONS[input.name] || {};

  return (
    <>
      <h3 style={{ marginBottom: '0.5rem' }}>
        {label || input.name} {input.isRequired ? <span style={{ color: '#DB3214' }}> *</span> : null}
      </h3>
      <div style={{ width: 400 }}>
        <NumberInput
          value={value || ''}
          placeholder={placeholder || ''}
          onChange={(e) => {
            onChange(e);
            if (validationRegex) {
              const regex = new RegExp(validationRegex);
              if (!regex.test(e) && e !== null) {
                onValidation('Invalid float value');
              } else {
                onValidation(undefined);
              }
            }
          }}
        />
      </div>
      {validationError && <div style={{ color: 'red', marginTop: '0.5rem' }}>{validationError}</div>}
      {helpText && <div style={{ marginTop: '0.5rem', marginBottom: '2rem', fontStyle: 'italic' }}>{helpText}</div>}
    </>
  );
};
