import { Icon } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';

interface PipelineWidgetWrapperProps {
  title: string;
  children: ReactNode;
  marginTop?: string;
  marginBottom?: string;
  width?: string;
  padding?: string;
  backgroundColor?: string;
}

// Wrapper component for sidebar widgets to ensure consistent styling
export const PipelineWidgetContainer = ({
  title,
  children,
  marginTop = '1rem',
  marginBottom = '1rem',
  width = '400px',
  padding = '1rem 1rem 1.5rem',
  backgroundColor = '#f4f6f9',
}: PipelineWidgetWrapperProps) => {
  return (
    <div
      style={{
        marginTop,
        marginBottom,
        backgroundColor,
        width,
        padding,
        borderRadius: '4px',
      }}
    >
      <h3 style={{ marginTop: '0.5rem' }}>
        <Icon icon='info-circle' style={{ color: '#5CC88D' }} /> {title}
      </h3>
      {children}
    </div>
  );
};
