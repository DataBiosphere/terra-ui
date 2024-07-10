import React from 'react';
import { TerraLengthyOperationOverlay } from 'src/branding/TerraLengthyOperationOverlay';

export const CreatingWorkspaceMessage = (): React.ReactNode => {
  return <TerraLengthyOperationOverlay message='Creating and provisioning your workspace.' />;
};
