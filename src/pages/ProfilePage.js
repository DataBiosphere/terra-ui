import { h } from 'react-hyperscript-helpers';
import FooterWrapper from 'src/components/FooterWrapper';
import { TopBar } from 'src/components/TopBar';
import { Profile } from 'src/profile/Profile';

const ProfilePage = () => {
  return h(FooterWrapper, [h(TopBar, { title: 'User Profile' }), h(Profile)]);
};

export const navPaths = [
  {
    name: 'profile',
    path: '/profile',
    component: ProfilePage,
    title: 'Profile',
  },
  {
    name: 'fence-callback',
    path: '/fence-callback',
    component: ProfilePage,
    title: 'Profile',
  },
  {
    name: 'ecm-callback',
    path: '/ecm-callback',
    component: ProfilePage,
    title: 'Profile',
  },
  {
    name: 'oauth-callback',
    path: '/oauth_callback',
    component: ProfilePage,
    title: 'Profile',
  },
];
