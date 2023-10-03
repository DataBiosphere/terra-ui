import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { FenceLink } from 'src/pages/profile/external-identities/FenceLink';

// Mocking for Nav.getLink
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => '/'),
  useRoute: jest.fn(() => 'fence-callback'),
}));

describe('FenceLink', () => {
  it('renders', async () => {
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
  });
});
