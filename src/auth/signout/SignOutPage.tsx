import { useEffect } from 'react';
import { SignOutCause, SignOutRedirect, userSignedOut } from 'src/auth/signout/sign-out';
import * as Nav from 'src/libs/nav';

export const signOutCallbackLinkName = 'signout-callback';
export const SignOutPage = () => {
  const { query } = Nav.useRoute();
  const { state } = query;
  const decoded: { signOutRedirect?: SignOutRedirect; signOutCause?: SignOutCause } = state
    ? JSON.parse(atob(state))
    : {};
  const { signOutRedirect, signOutCause } = decoded;
  useEffect(() => {
    try {
      userSignedOut(signOutCause);
    } catch (e) {
      console.error(e);
    }
    if (signOutRedirect) {
      Nav.goToPath(signOutRedirect.name, signOutRedirect.params, signOutRedirect.query);
    } else {
      Nav.goToPath('root');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

export const navPaths = [
  {
    name: signOutCallbackLinkName,
    path: '/signout',
    component: SignOutPage,
    title: 'SignOut',
  },
];
