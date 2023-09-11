import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { signOut, SignOutCause } from 'src/libs/auth';

export const Disabled = () => {
  return div({ role: 'main', style: { padding: '1rem' } }, [
    div(['Thank you for registering. Your account is currently inactive. ', 'You will be contacted via email when your account is activated.']),
    div({ style: { marginTop: '1rem' } }, [h(Link, { onClick: () => signOut(SignOutCause.disabled) }, 'Sign out')]),
  ]);
};
