import React from 'react';
import { PipelineIOType } from 'src/libs/ajax/teaspoons/teaspoons-models';

interface PipelineIOTypeBadgeProps {
  type: PipelineIOType | string;
}

const getTypeColor = (type: PipelineIOType | string): string => {
  switch (type.toUpperCase()) {
    case 'FILE':
      return '#e7f3fb';
    case 'FILE_ARRAY':
      return '#d1ecf1';
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

export const PipelineIOTypeBadge = ({ type }: PipelineIOTypeBadgeProps) => {
  return (
    <div
      style={{
        backgroundColor: getTypeColor(type),
        borderRadius: 8,
        border: '1px solid #e4e5e6',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.5rem',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        alignSelf: 'center',
      }}
    >
      <span
        style={{
          textTransform: 'capitalize',
          fontWeight: 500,
          fontSize: 12,
          lineHeight: 1.25,
        }}
      >
        {type.toLowerCase().replaceAll('_', ' ')}
      </span>
    </div>
  );
};
