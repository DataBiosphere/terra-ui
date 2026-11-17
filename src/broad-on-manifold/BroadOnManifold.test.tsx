import { renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useIsBroadOnManifoldUser, useShowBroadOnManifoldCards } from 'src/broad-on-manifold/broad-on-manifold-utils';
import * as BroadOnManifoldPage from 'src/broad-on-manifold/BroadOnManifoldPage';
import * as ChoosingAPlatformPage from 'src/broad-on-manifold/ChoosingAPlatformPage';
import { getBroadOnManifoldDocLinks, LandingProductCards } from 'src/broad-on-manifold/LandingProductCards';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { isTerra } from 'src/libs/brand-utils';
import { brands } from 'src/libs/brands';
import { AppConfigSettings, getConfig } from 'src/libs/config';
import Events from 'src/libs/events';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { BROAD_ON_MANIFOLD_FEATURE_ID } from 'src/libs/feature-previews-config';
import { authStore, SignInStatus, userStore } from 'src/libs/state';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax/Metrics');

type FeaturePreviewsExports = typeof import('src/libs/feature-previews');
jest.mock(
  'src/libs/feature-previews',
  (): FeaturePreviewsExports => ({
    ...jest.requireActual<FeaturePreviewsExports>('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn(),
  })
);

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

type BrandUtilsExports = typeof import('src/libs/brand-utils');
jest.mock(
  'src/libs/brand-utils',
  (): BrandUtilsExports => ({
    ...jest.requireActual<BrandUtilsExports>('src/libs/brand-utils'),
    isTerra: jest.fn(),
  })
);

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn((name: string) => `#${name}`),
  })
);

// The pages render Terra's top bar and footer; their behavior is covered elsewhere.
jest.mock('src/components/TopBar', () => ({ TopBar: () => null }));
jest.mock(
  'src/components/FooterWrapper',
  () =>
    ({ children }) =>
      children
);

const BroadOnManifold = BroadOnManifoldPage.navPaths[0].component;
const ChoosingAPlatform = ChoosingAPlatformPage.navPaths[0].component;

const stageUrl = 'https://broad.sc-stage.manifold.ai';
const broadEmail = 'researcher@broadinstitute.org';

const setUp = ({
  terra = true,
  url = stageUrl,
  signInStatus = 'userLoaded',
  email = broadEmail,
}: { terra?: boolean; url?: string; signInStatus?: SignInStatus; email?: string } = {}) => {
  asMockedFn(isTerra).mockReturnValue(terra);
  asMockedFn(getConfig).mockReturnValue(partial<AppConfigSettings>({ broadOnManifoldUrl: url }));
  authStore.update((state) => ({ ...state, signInStatus }));
  userStore.update((state) => ({ ...state, terraUser: { ...state.terraUser, email } }));
  const captureEvent = jest.fn();
  asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));
  return { captureEvent };
};

describe('useIsBroadOnManifoldUser', () => {
  it.each([
    { case: 'a signed-in Broad user', options: {}, expected: true },
    { case: 'a Broad user while Sam is still loading', options: { signInStatus: 'authenticated' }, expected: true },
    { case: 'a Broad email in another case', options: { email: 'Researcher@BroadInstitute.org' }, expected: true },
    { case: 'a non-Broad user', options: { email: 'researcher@gmail.com' }, expected: false },
    { case: 'a look-alike domain', options: { email: 'researcher@notbroadinstitute.org' }, expected: false },
    {
      case: 'a Broad domain inside another',
      options: { email: 'researcher@broadinstitute.org.example.com' },
      expected: false,
    },
    { case: 'a signed-out visitor', options: { signInStatus: 'signedOut' }, expected: false },
    { case: 'a visitor before auth initializes', options: { signInStatus: 'uninitialized' }, expected: false },
    { case: 'a co-brand', options: { terra: false }, expected: false },
    { case: 'an environment without broadOnManifoldUrl', options: { url: '' }, expected: false },
  ] as { case: string; options: Parameters<typeof setUp>[0]; expected: boolean }[])(
    'is $expected for $case',
    ({ options, expected }) => {
      setUp(options);

      const { result } = renderHook(() => useIsBroadOnManifoldUser());

      expect(result.current).toBe(expected);
    }
  );
});

describe('useShowBroadOnManifoldCards', () => {
  it.each([
    { case: 'a Broad user who turned on the preview', email: broadEmail, preview: true, expected: true },
    { case: 'a Broad user who has not turned on the preview', email: broadEmail, preview: false, expected: false },
    {
      case: 'a non-Broad user who turned on the preview',
      email: 'researcher@gmail.com',
      preview: true,
      expected: false,
    },
  ])('is $expected for $case', ({ email, preview, expected }) => {
    setUp({ email });
    asMockedFn(isFeaturePreviewEnabled).mockImplementation((id) => preview && id === BROAD_ON_MANIFOLD_FEATURE_ID);

    const { result } = renderHook(() => useShowBroadOnManifoldCards());

    expect(result.current).toBe(expected);
  });
});

describe('LandingProductCards', () => {
  it('offers Terra and Manifold side by side, with the same structure', async () => {
    const { captureEvent } = setUp();
    const user = userEvent.setup();

    render(<LandingProductCards needsBillingProject={false} />);

    const terraCard = within(screen.getByRole('region', { name: 'Terra workspaces' }));
    expect(terraCard.getByRole('link', { name: 'View Workspaces' })).toHaveAttribute('href', '#workspaces');
    expect(terraCard.getByRole('link', { name: 'View Example Workflows' })).toHaveAttribute(
      'href',
      '#library-showcase'
    );
    const support = terraCard.getByRole('link', { name: 'View Support Documentation' });
    expect(support).toHaveAttribute('href', 'https://support.terra.bio/hc/en-us');
    expect(support).toHaveAttribute('target', '_blank');
    expect(terraCard.queryByRole('link', { name: 'Browse Data on DUOS' })).not.toBeInTheDocument();

    expect(
      terraCard.getByText("You'll need a Google Cloud billing account to create a workspace.")
    ).toBeInTheDocument();
    expect(terraCard.getByRole('link', { name: 'Manage billing' })).toHaveAttribute('href', '#billing');

    const manifoldCard = within(screen.getByRole('region', { name: 'Manifold projects' }));
    const viewProjects = manifoldCard.getByRole('link', { name: 'View Manifold projects' });
    expect(viewProjects).toHaveAttribute('href', '#broad-on-manifold');
    expect(manifoldCard.getByText("You'll need a Broad cost object to start a project.")).toBeInTheDocument();
    expect(manifoldCard.getByRole('link', { name: 'Request a cost object' })).toHaveAttribute('target', '_blank');
    expect(manifoldCard.getByRole('link', { name: 'View Support Documentation' })).toHaveAttribute(
      'href',
      'https://support.manifold.ai/hc/en-us'
    );
    expect(manifoldCard.getByRole('link', { name: 'Learn more about Manifold' })).toHaveAttribute('target', '_blank');
    expect(screen.queryByText(/@manifold\.ai/)).not.toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Compare Terra and Manifold' })).toHaveAttribute(
      'href',
      '#broad-on-manifold-choosing-a-platform'
    );

    await user.click(viewProjects);
    expect(captureEvent).toHaveBeenCalledWith(Events.broadOnManifoldViewProjects, { source: 'landingPage' });
  });

  it('tells a user with no billing project to set one up before creating a Terra workspace', () => {
    setUp();

    render(<LandingProductCards needsBillingProject />);

    const terraCard = within(screen.getByRole('region', { name: 'Terra workspaces' }));
    expect(
      terraCard.getByText("You'll need a Google Cloud billing account to create a workspace.")
    ).toBeInTheDocument();
    expect(terraCard.getByRole('link', { name: 'Set up billing' })).toHaveAttribute('href', '#billing');
    expect(terraCard.queryByRole('link', { name: 'Manage billing' })).not.toBeInTheDocument();
    expect(terraCard.getByRole('link', { name: 'View Workspaces' })).toBeInTheDocument();
  });
});

describe('getBroadOnManifoldDocLinks', () => {
  it("puts DUOS first and drops Terra's support link, which moves into the Terra card", () => {
    const links = getBroadOnManifoldDocLinks(brands.terra.docLinks);

    expect(links[0]).toEqual({ link: 'https://duos.org', text: 'Browse Data on DUOS' });
    expect(links.map(({ link }) => link)).not.toContain('https://support.terra.bio/hc/en-us');
    expect(links).toHaveLength(brands.terra.docLinks.length);
  });
});

describe.each([
  { name: 'Broad on Manifold handoff page', navPath: BroadOnManifoldPage.navPaths[0] },
  { name: 'Choosing a platform page', navPath: ChoosingAPlatformPage.navPaths[0] },
])('$name', ({ navPath }) => {
  it('requires sign-in', () => {
    // AuthContainer shows Terra's sign-in page in place of any route that is not public
    expect(navPath).not.toHaveProperty('public');
  });

  it('shows Page not found to signed-in users without a Broad email', () => {
    setUp({ email: 'researcher@gmail.com' });
    const Page = navPath.component;

    render(<Page />);

    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.queryByText('Broad on Manifold')).not.toBeInTheDocument();
  });
});

describe('Broad on Manifold handoff page', () => {
  it('sends Broad users to the configured Manifold instance in the same tab', async () => {
    const { captureEvent } = setUp();
    const user = userEvent.setup();

    render(<BroadOnManifold />);

    const signIn = screen.getByRole('link', { name: 'Sign in to Broad on Manifold' });
    expect(signIn).toHaveAttribute('href', `${stageUrl}/nova/projects`);
    expect(signIn).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'Request a cost object' })).toHaveAttribute('target', '_blank');
    expect(screen.queryByText(/@manifold\.ai/)).not.toBeInTheDocument();

    // jsdom can't navigate to another origin
    signIn.addEventListener('click', (e) => e.preventDefault());
    await user.click(signIn);
    expect(captureEvent).toHaveBeenCalledWith(Events.broadOnManifoldSignIn, { source: 'handoffPage' });
  });
});

describe('Choosing a platform page', () => {
  it('offers both Manifold and Terra to Broad users, compares them, and gives Manifold support for moving projects', () => {
    setUp();

    render(<ChoosingAPlatform />);

    expect(screen.getByRole('link', { name: 'Get started with Manifold' })).toHaveAttribute(
      'href',
      '#broad-on-manifold'
    );
    expect(screen.getByRole('link', { name: 'Go to Terra workspaces' })).toHaveAttribute('href', '#workspaces');
    expect(screen.getByRole('columnheader', { name: 'Terra workspaces' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Manifold projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'support@manifold.ai' })).toHaveAttribute(
      'href',
      'mailto:support@manifold.ai'
    );
  });
});
