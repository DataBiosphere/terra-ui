import React, { CSSProperties, PropsWithChildren } from 'react';
import colors from 'src/libs/colors';

function stepBanner(active: boolean): CSSProperties {
  return {
    borderRadius: '8px',
    boxSizing: 'border-box',
    padding: '1.5rem 2rem',
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    border: active ? `1px solid ${colors.accent()}` : `1px solid ${colors.accent(0.2)}`,
    backgroundColor: active ? colors.light(0.5) : colors.light(0.3),
    boxShadow: active ? `0 0 5px 0 ${colors.accent(0.5)}` : 'none',
  };
}

export type StepProps = PropsWithChildren<{
  isActive: boolean;
  style?: React.CSSProperties;
}>;

export const Step = ({ isActive, children, style }: StepProps) => (
  <li data-test-id='Step' aria-current={isActive ? 'step' : false} style={{ ...stepBanner(isActive), ...style }}>
    {children}
  </li>
);
