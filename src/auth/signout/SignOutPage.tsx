import { useEffect } from 'react';
import { userSignedOut } from 'src/auth/signout/sign-out';
import * as Nav from 'src/libs/nav';

export const signOutCallbackLinkName = 'signout-callback';
export const SignOutPage = () => {
  useEffect(() => {
    try {
      userSignedOut();
    } catch (e) {
      console.error(e);
    }
    Nav.goToPath('root');
  }, []);
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
