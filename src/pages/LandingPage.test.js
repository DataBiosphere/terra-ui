import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { useIsBroadOnManifoldUser } from 'src/broad-on-manifold/broad-on-manifold-utils';
import { Billing } from 'src/libs/ajax/billing/Billing';
import { authStore } from 'src/libs/state';
import { LandingPage } from 'src/pages/LandingPage';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/broad-on-manifold/broad-on-manifold-utils', () => ({
  ...jest.requireActual('src/broad-on-manifold/broad-on-manifold-utils'),
  useIsBroadOnManifoldUser: jest.fn().mockReturnValue(false),
}));

jest.mock('src/libs/ajax/billing/Billing');

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn().mockImplementation((_) => _),
}));

const billingBanner = 'To use Terra, you need to link Terra to a cloud billing account for compute and storage costs.';

const signInWithBillingProjects = (projects) => {
  Billing.mockReturnValue({ listProjects: jest.fn(async () => projects) });
  authStore.update((state) => ({ ...state, signInStatus: 'authenticated' }));
};

describe('Landing Page (GCP)', () => {
  // Reset before rendering, not after: changing authStore while the page is still mounted updates it outside act().
  beforeEach(() => {
    authStore.update((state) => ({ ...state, signInStatus: 'uninitialized' }));
    useIsBroadOnManifoldUser.mockReturnValue(false);
  });

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

  it('shows the Terra and Manifold product cards instead of the landing cards to users on the Broad on Manifold list', async () => {
    // Arrange
    useIsBroadOnManifoldUser.mockReturnValue(true);

    // Act
    await act(async () => {
      render(h(LandingPage));
    });

    // Assert
    expect(screen.getByRole('region', { name: 'Terra workspaces' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Manifold projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Data on DUOS' })).toHaveAttribute('href', 'https://duos.org');
    expect(screen.queryByRole('link', { name: /Find how-to's/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: 'View Examples Browse our gallery of showcase Workspaces to see how science gets done.',
      })
    ).not.toBeInTheDocument();
  });

  it('shows the standard landing cards while Sam has not said whether the user is on the list', async () => {
    // Arrange
    useIsBroadOnManifoldUser.mockReturnValue(undefined);

    // Act
    await act(async () => {
      render(h(LandingPage));
    });

    // Assert
    expect(
      screen.getByRole('link', {
        name: 'View Examples Browse our gallery of showcase Workspaces to see how science gets done.',
      })
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Manifold projects' })).not.toBeInTheDocument();
  });

  it('shows the billing banner to a user with no billing projects', async () => {
    // Arrange
    signInWithBillingProjects([]);

    // Act
    await act(async () => {
      render(h(LandingPage));
    });

    // Assert
    expect(screen.getByText(billingBanner)).toBeInTheDocument();
  });

  it('moves the billing message into the Terra card for users who see the product cards', async () => {
    // Arrange
    useIsBroadOnManifoldUser.mockReturnValue(true);
    signInWithBillingProjects([]);

    // Act
    await act(async () => {
      render(h(LandingPage));
    });

    // Assert
    expect(screen.queryByText(billingBanner)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Set up billing' })).toHaveAttribute('href', 'billing');
  });

  it('offers to manage billing, not set it up, to a user on the list who has a billing project', async () => {
    // Arrange
    useIsBroadOnManifoldUser.mockReturnValue(true);
    signInWithBillingProjects([{ projectName: 'my-project' }]);

    // Act
    await act(async () => {
      render(h(LandingPage));
    });

    // Assert
    expect(screen.queryByText(billingBanner)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Set up billing' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage billing' })).toHaveAttribute('href', 'billing');
  });
});
