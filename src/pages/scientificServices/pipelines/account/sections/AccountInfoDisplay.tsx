import React from 'react';

interface AccountInfoDisplayProps {
  firstName: string | undefined;
  lastName: string | undefined;
  email: string | undefined;
}

export const AccountInfoDisplay: React.FC<AccountInfoDisplayProps> = ({ firstName, lastName, email }) => {
  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>First Name:</strong> {firstName || 'N/A'}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Last Name:</strong> {lastName || 'N/A'}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Email:</strong> {email || 'N/A'}
      </div>
    </div>
  );
};
