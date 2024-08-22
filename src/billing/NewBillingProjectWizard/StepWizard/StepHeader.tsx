import React, { CSSProperties, PropsWithChildren, ReactNode } from 'react';

type StepHeaderProps = PropsWithChildren<{
  title: ReactNode;
  style?: CSSProperties;
}>;

export const StepHeader = ({ title, style }: StepHeaderProps) => (
  <header style={{ width: '100%', display: 'flex', flexDirection: 'row', ...style }}>
    <h3 style={{ fontSize: 18, marginTop: 0, marginRight: '1rem' }}>{title}</h3>
  </header>
);
