import { div, h } from 'react-hyperscript-helpers';
import { signOut } from 'src/auth/auth';
import { Link } from 'src/components/common';

export const Disabled = () => {
  return div({ role: 'main', style: { padding: '1rem' } }, [
    div(['Thank you for registering. Your account is currently inactive. ', 'You will be contacted via email when your account is activated.']),
    div({ style: { marginTop: '1rem' } }, [h(Link, { onClick: () => signOut('disabled') }, 'Sign out')]),
  ]);
};
