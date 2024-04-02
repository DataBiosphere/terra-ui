import { useEffect } from 'react';
import { SignOutState, userSignedOut } from 'src/auth/signout/sign-out';
import * as Nav from 'src/libs/nav';

export const signOutCallbackLinkName = 'signout-callback';
export const SignOutPage = () => {
  const { query } = Nav.useRoute();
  const { state } = query;
  const decodedState: SignOutState | undefined = state ? JSON.parse(atob(state)).postLogoutRedirect : undefined;
  useEffect(() => {
    try {
      userSignedOut();
    } catch (e) {
      console.error(e);
    }
    if (decodedState) {
      Nav.goToPath(decodedState.name, decodedState.params, decodedState.query);
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
