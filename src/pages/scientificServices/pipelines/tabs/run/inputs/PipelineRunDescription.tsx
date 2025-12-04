import React from 'react';
import { TextArea } from 'src/components/input';

interface PipelineRunDescriptionProps {
  value: string;
  onChange: (value: string) => void;
}

export const PipelineRunDescription: React.FC<PipelineRunDescriptionProps> = ({ value, onChange }) => {
  return (
    <>
      <h3 style={{ marginBottom: '0.5rem' }}>Enter description</h3>
      <TextArea
        rows={4}
        aria-label='description'
        value={value}
        placeholder='Enter optional description'
        style={{ width: 500 }}
        onChange={onChange}
      />
    </>
  );
};
