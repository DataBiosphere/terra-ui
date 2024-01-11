import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { LandingPage } from 'src/pages/LandingPage';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn().mockImplementation((_) => _),
}));

describe('Landing Page (GCP)', () => {
  it('loads the landing page', async () => {
    // Act
    await act(async () => {
      render(h(LandingPage));
    });

    // Assert
    const viewExamplesButton = screen.getByRole('link', {
      name: 'View Examples Browse our gallery of showcase Workspaces to see how science gets done.',
    });
    expect(viewExamplesButton).toHaveAttribute('href', 'library-showcase');
  });
});
