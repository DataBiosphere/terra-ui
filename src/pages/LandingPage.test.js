import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { useShowBroadOnManifoldCards } from 'src/broad-on-manifold/broad-on-manifold-utils';
import { LandingPage } from 'src/pages/LandingPage';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/broad-on-manifold/broad-on-manifold-utils', () => ({
  ...jest.requireActual('src/broad-on-manifold/broad-on-manifold-utils'),
  useShowBroadOnManifoldCards: jest.fn().mockReturnValue(false),
}));

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

  it('shows the Terra and Manifold product cards instead of the landing cards to Broad users who turned on the preview', async () => {
    // Arrange
    useShowBroadOnManifoldCards.mockReturnValue(true);

    // Act
    await act(async () => {
      render(h(LandingPage));
    });

    // Assert
    expect(screen.getByRole('region', { name: 'Terra workspaces' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Manifold projects' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: 'View Examples Browse our gallery of showcase Workspaces to see how science gets done.',
      })
    ).not.toBeInTheDocument();
  });
});
