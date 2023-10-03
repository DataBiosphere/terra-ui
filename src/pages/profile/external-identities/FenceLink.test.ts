import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { FenceLink } from 'src/pages/profile/external-identities/FenceLink';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => '/'),
  useRoute: jest.fn(() => {
    return { name: 'fence-callback' };
  }),
}));

describe('User is not linked', () => {
  it('renders spinner while fence-callback is loading', async () => {
    // @ts-ignore
    delete window.location;
    global.window = Object.create(window);
    const state = btoa(JSON.stringify({ provider: 'fence' }));
    // @ts-ignore
    global.window.location = {
      search: `?state=${state}`,
    };
    // Arrange
    const props = {
      key: 'fence',
      provider: {
        key: 'fence',
        name: 'NHLBI BioData Catalyst Framework Services',
        expiresAfter: 30,
        short: 'NHLBI',
      },
    };
    // Act
    render(h(FenceLink, props));
    // Assert
    expect(screen.getByText('Loading account status...')).not.toBeNull();
  });

  it('renders the login button', async () => {
    // Arrange
    const props = {
      key: 'fence',
      provider: {
        key: 'fence',
        name: 'NHLBI BioData Catalyst Framework Services',
        expiresAfter: 30,
        short: 'NHLBI',
      },
    };
    // Act
    render(h(FenceLink, props));
    // Assert
    expect(screen.getByText('Log in to NHLBI')).not.toBeNull();
  });
});

// describe('User is linked', () => {
//   it('renders the renew and unlink buttons');
// });
