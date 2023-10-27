import { h } from 'react-hyperscript-helpers';
import { Profile } from 'src/auth/profile/Profile';
import FooterWrapper from 'src/components/FooterWrapper';
import TopBar from 'src/components/TopBar';

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
];