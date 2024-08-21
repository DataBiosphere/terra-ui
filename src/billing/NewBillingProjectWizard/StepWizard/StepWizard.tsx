import React, { PropsWithChildren, ReactNode } from 'react';

export type StepWizardProps = PropsWithChildren<{
  title: string;
  intro: ReactNode;
}>;

export const StepWizard = ({ children, title, intro }: StepWizardProps): ReactNode => {
  return (
    <section style={{ padding: '1.5rem 3rem', width: '100%' }}>
      <h2 style={{ fontWeight: 'bold', fontSize: 18 }}>{title}</h2>
      <div style={{ marginTop: '0.5rem', fontSize: 14, padding: 0, listStyleType: 'none', width: '100%' }}>{intro}</div>
      <ul style={{ padding: 0 }}>{children}</ul>
    </section>
  );
};
