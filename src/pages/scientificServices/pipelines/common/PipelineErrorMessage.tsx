import React, { ReactNode } from 'react';

interface PipelineErrorMessageProps {
  title: string;
  message: ReactNode;
}

export const PipelineErrorMessage = ({ title, message }: PipelineErrorMessageProps) => {
  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.5rem',
        borderRadius: '4px',
        backgroundColor: '#f8d7da',
        color: '#842029',
      }}
    >
      <div style={{ margin: '1rem', fontWeight: 'bold' }}>{title}</div>
      <div style={{ margin: '1rem', fontFamily: 'monospace' }}>{message}</div>
    </div>
  );
};
