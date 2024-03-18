import React from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import TopBar from 'src/components/TopBar';

export const logoutCallbackLinkName = 'logout-callback';
const Logout = () => {
  return (
    <FooterWrapper>
      <TopBar title="Logout" href={undefined}>
        <div />
      </TopBar>
    </FooterWrapper>
  );
};

export const navPaths = [
  {
    name: logoutCallbackLinkName,
    path: '/logout',
    component: Logout,
    title: 'Logout',
  },
];
