import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { FenceLink } from 'src/pages/profile/external-identities/FenceLink';

describe('User is not linked', () => {
  jest.mock('src/libs/nav', () => ({
    ...jest.requireActual('src/libs/nav'),
    getLink: jest.fn(() => '/'),
    useRoute: jest.fn(() => {
      return { name: 'fence-callback' };
    }),
  }));

  it('renders spinner while fence-callback is loading', async () => {
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

describe('User is linked', () => {
  it('renders the renew and unlink buttons');
});
