import React, { ReactNode } from 'react';
import { TerraHexagonsAnimation, TerraHexagonsAnimationProps } from 'src/branding/TerraHexagonsAnimation';

interface TerraLengthyOperationOverlayProps extends TerraHexagonsAnimationProps {
  message: string;
}

export const TerraLengthyOperationOverlay = (props: TerraLengthyOperationOverlayProps): ReactNode => {
  const { message, ...otherProps } = props;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      {...otherProps}
    >
      <TerraHexagonsAnimation aria-hidden='true' size={150} style={{ margin: '2rem 0' }}>
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
