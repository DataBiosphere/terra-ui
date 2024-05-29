import React from 'react';
import { TerraHexagonsAnimation } from 'src/branding/TerraHexagonsAnimation';

export const CreatingWorkspaceMessage = (): React.ReactNode => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <TerraHexagonsAnimation aria-hidden size={150} style={{ margin: '2rem 0' }}>
        <div style={{ color: '#225C00', fontWeight: 'bold' }}>Loading...</div>
      </TerraHexagonsAnimation>
      <div role='alert' style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 'bold' }}>Please stand by...</p>
        <p>Creating and provisioning your workspace.</p>
        <p>This may take a few minutes.</p>
      </div>
    </div>
  );
};
