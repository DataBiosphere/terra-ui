import React from 'react';

export type InputType = 'FILE' | 'STRING' | 'FLOAT' | 'BOOLEAN';

interface InputTypeBadgeProps {
  type: InputType | string;
}

const getTypeColor = (type: string): string => {
  switch (type.toUpperCase()) {
    case 'FILE':
      return '#e7f3fb';
    case 'STRING':
      return '#f0e7fb';
    case 'FLOAT':
      return '#fff3cd';
    case 'BOOLEAN':
      return '#d4edda';
    default:
      return '#e4e5e6';
  }
};

export const InputTypeBadge = ({ type }: InputTypeBadgeProps) => {
  return (
    <div
      style={{
        backgroundColor: getTypeColor(type),
        borderRadius: 8,
        border: '1px solid #e4e5e6',
        display: 'flex',
        alignItems: 'center',
        padding: '0.25rem 0.5rem',
      }}
    >
      <span
        style={{
          textTransform: 'capitalize',
          fontWeight: 500,
          fontSize: '0.875rem',
        }}
      >
        {type.toLowerCase()}
      </span>
    </div>
  );
};
