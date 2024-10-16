import { ButtonPrimary } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { signOut } from 'src/auth/signout/sign-out';

export const Disabled = (): ReactNode => {
  return (
    <div role='main' style={{ padding: '1rem' }}>
      <div>
        Thank you for registering. Your account is currently inactive. You will be contacted via email when your account
        is activated.
      </div>
      <div style={{ marginTop: '1rem' }}>
        <ButtonPrimary onClick={() => signOut('disabled')}>Sign out</ButtonPrimary>
      </div>
    </div>
  );
};
