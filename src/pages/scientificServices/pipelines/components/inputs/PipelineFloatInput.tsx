import React, { ReactNode } from 'react';
import { ValidatedInput } from 'src/components/input';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';

interface PipelineFloatInputProps {
  input: PipelineInput;
  value: string;
  onChange: (value: string) => void;
  validationError?: ReactNode;
  onValidation(error?: ReactNode): void;
}

export const PipelineFloatInput: React.FC<PipelineFloatInputProps> = ({
  input,
  value,
  onChange,
  validationError,
  onValidation,
}) => {
  const { name, displayName, description, isRequired, defaultValue, minValue, maxValue } = input;

  return (
    <>
      <h3 style={{ marginBottom: '0.5rem' }}>
        Enter {displayName || name} {isRequired ? <span style={{ color: '#DB3214' }}> *</span> : null}
      </h3>
      <ValidatedInput
        width={400}
        error={validationError}
        inputProps={{
          'aria-label': `${displayName || name} float input`,
          type: 'text',
          value: value || '',
          placeholder: defaultValue || `Enter ${displayName || name}`,
          onChange: (e) => {
            onChange(e);
            onValidation(validatePipelineFloatInput(e, minValue, maxValue));
          },
        }}
      />
      {description && (
        <div style={{ marginTop: '0.5rem', marginBottom: '2rem', fontStyle: 'italic', maxWidth: 500 }}>
          {description}
        </div>
      )}
    </>
  );
};

export const validatePipelineFloatInput = (value: string, minValue?: number, maxValue?: number): string | undefined => {
  const floatValue = Number.parseFloat(value);
  if (value.trim().length === 0) {
    return undefined;
  }
  if (Number.isNaN(floatValue)) {
    return 'Enter a valid float value';
  }
  if (minValue !== undefined && floatValue < minValue) {
    return `Value must be between ${minValue} and ${maxValue}`;
  }
  if (maxValue !== undefined && floatValue > maxValue) {
    return `Value must be between ${minValue} and ${maxValue}`;
  }
  return undefined;
};
