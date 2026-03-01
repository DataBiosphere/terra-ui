import React from 'react';
import { getTerraUser, getTerraUserProfile } from 'src/libs/state';

export const BasicAccountInfoDisplay: React.FC = () => {
  const terraUser = getTerraUser();
  const userProfile = getTerraUserProfile();

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>First Name:</strong> {userProfile.firstName || 'N/A'}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Last Name:</strong> {userProfile.lastName || 'N/A'}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Email:</strong> {terraUser.email || 'N/A'}
      </div>
    </div>
  );
};
