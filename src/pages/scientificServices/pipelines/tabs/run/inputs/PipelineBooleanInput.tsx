import React from 'react';
import { LabeledCheckbox } from 'src/components/common';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';

interface PipelineBooleanInputProps {
  input: PipelineInput;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const PipelineBooleanInput: React.FC<PipelineBooleanInputProps> = ({ input, value, onChange }) => {
  const { name, displayName, description, defaultValue, isRequired } = input;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
        <LabeledCheckbox
          checked={value ?? defaultValue ?? false}
          width={400}
          onChange={(e) => {
            onChange(e);
          }}
        >
          <div style={{ marginLeft: '0.5rem', fontWeight: 'bold', fontSize: 16 }}>
            {displayName || name} {isRequired ? <span style={{ color: colors.danger() }}> *</span> : null}
          </div>
        </LabeledCheckbox>
      </div>
      {description && (
        <div style={{ marginBottom: '1.5rem', marginTop: '0.5rem', fontStyle: 'italic', maxWidth: 500 }}>
          {description}
        </div>
      )}
    </>
  );
};
