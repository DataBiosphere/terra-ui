import { h } from 'react-hyperscript-helpers';
import { ButtonPrimary } from 'src/components/common';
import { spinner } from 'src/components/icons';
import { isAuthSettled, signIn } from 'src/libs/auth';
import { useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';

const SignInButton = () => {
  const auth = useStore(authStore);

  const isAuthInitialized = isAuthSettled(auth);

  return !isAuthInitialized
    ? spinner()
    : h(
        ButtonPrimary,
        {
          id: 'signInButton',
          onClick: () => signIn(false),
          style: { marginTop: '0.875rem', width: '9.4rem', height: '3.2rem', fontSize: '1rem' },
        },
        ['log in']
      );
};

export default SignInButton;
