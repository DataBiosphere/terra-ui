import { Spinner } from '@terra-ui-packages/components';
import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { signIn } from 'src/auth/signin/sign-in';
import { ButtonPrimary } from 'src/components/common';
import { useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';

const SignInButton = (): ReactNode => {
  const { signInStatus } = useStore(authStore);

  const isAuthInitialized = signInStatus !== 'uninitialized';

  return isAuthInitialized
    ? h(
        ButtonPrimary,
        {
          id: 'signInButton',
          onClick: () => signIn(false),
          style: { marginTop: '0.875rem', width: '9.4rem', height: '3.2rem', fontSize: '1rem' },
        },
        ['Sign In']
      )
    : h(Spinner);
};

export default SignInButton;
