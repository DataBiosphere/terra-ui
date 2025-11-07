import React, { ReactNode } from 'react';
import { ValidatedInput } from 'src/components/input';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';

interface PipelineStringInputProps {
  input: PipelineInput;
  value: string;
  onChange: (value: string) => void;
  validationError?: ReactNode;
  onValidation(error?: ReactNode): void;
}

export const PipelineStringInput: React.FC<PipelineStringInputProps> = ({
  input,
  value,
  onChange,
  validationError,
  onValidation,
}) => {
  const { name, displayName, description, defaultValue, isRequired } = input;

  return (
    <>
      <h3 style={{ marginBottom: '0.5rem' }}>
        Enter {displayName || name} {isRequired ? <span style={{ color: '#DB3214' }}> *</span> : null}
      </h3>
      <ValidatedInput
        width={400}
        error={validationError}
        inputProps={{
          'aria-label': `${displayName || name} text input`,
          type: 'text',
          value: value || '',
          placeholder: defaultValue || `Enter ${displayName || name}`,
          onChange: (e) => {
            onChange(e);
            onValidation(validatePipelineStringInput(e));
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

export const validatePipelineStringInput = (value: string): string | undefined => {
  const validationRegex = /^[a-zA-Z0-9_.-]+$/;
  if (value.trim().length === 0) {
    return undefined;
  }
  if (!validationRegex.test(value.trim())) {
    return 'This input contains invalid characters';
  }
  return undefined;
};
