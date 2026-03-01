import React from 'react';
import colors from 'src/libs/colors';
import { getTerraUser, getTerraUserProfile } from 'src/libs/state';

export const BasicAccountInfoDisplay: React.FC = () => {
  const terraUser = getTerraUser();
  const userProfile = getTerraUserProfile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <strong style={{ minWidth: '3rem' }}>Name</strong>
        <span>
          {userProfile.firstName || userProfile.lastName ? (
            [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ')
          ) : (
            <em style={{ color: colors.dark(0.5) }}>Name not provided</em>
          )}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <strong style={{ minWidth: '3rem' }}>Email</strong>
        <span>{terraUser.email ?? <em style={{ color: colors.dark(0.5) }}>Email not provided</em>}</span>
      </div>
    </div>
  );
};
