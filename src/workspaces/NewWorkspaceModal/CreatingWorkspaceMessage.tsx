import React from 'react';
import { TerraHexagonsAnimation } from 'src/branding/TerraHexagonsAnimation';

export const CreatingWorkspaceMessage = (props: { asyncClone?: boolean }): React.ReactNode => {
  const message = props.asyncClone
    ? 'Initiating workspace clone.'
    : "Creating and provisioning your workspace. Once it's ready, Terra will take you there.";
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <TerraHexagonsAnimation aria-hidden size={150} style={{ margin: '2rem 0' }}>
        <div style={{ color: '#225C00', fontWeight: 'bold' }}>Loading...</div>
      </TerraHexagonsAnimation>
      <div role='alert' style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 'bold' }}>Please stand by...</p>
        <p>{message}</p>
        <p>This may take a few minutes.</p>
      </div>
    </div>
  );
};
