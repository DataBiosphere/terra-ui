import React, { useEffect } from 'react';
import { userSignedOut } from 'src/auth/auth-events/signout';
import * as Nav from 'src/libs/nav';

export const logoutCallbackLinkName = 'logout-callback';
export const Logout = () => {
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
    name: logoutCallbackLinkName,
    path: '/logout',
    component: Logout,
    title: 'Logout',
  },
];
