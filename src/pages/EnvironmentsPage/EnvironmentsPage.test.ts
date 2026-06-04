import { screen } from '@testing-library/react';
import React from 'react';
import { h } from 'react-hyperscript-helpers';
import { DataRefreshInfo, Environments, EnvironmentsProps } from 'src/analysis/Environments/Environments';
import { leoAppProvider } from 'src/libs/ajax/leonardo/providers/LeoAppProvider';
import { leoDiskProvider } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { leoRuntimeProvider } from 'src/libs/ajax/leonardo/providers/LeoRuntimeProvider';
import { MetricsProvider, useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics';
import Events from 'src/libs/events';
import { terraNavKey, TerraNavLinkProvider } from 'src/libs/nav';
import { asMockedFn, renderWithAppContexts } from 'src/testing/test-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { UseWorkspaces } from 'src/workspaces/common/state/useWorkspaces.models';

import { leoResourceDeletable } from './deletableEnvironments';
import { EnvironmentsPage, makeNavProvider, navProvider } from './EnvironmentsPage';

jest.mock('src/analysis/Environments/Environments');

jest.mock('src/libs/ajax/metrics/useMetrics');

type FooterWrapperExports = typeof import('src/components/FooterWrapper') & { __esModule: true };
jest.mock(
  'src/components/FooterWrapper',
  (): FooterWrapperExports => ({
    __esModule: true,
    default: (props) => {
      return props.children;
    },
  })
);

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(),
  })
);

describe('Environments Page', () => {
  it('renders Environments component with correct args', () => {
    // Act
    /* Note: Because we are mocking the inner Environments component and just testing that we
       are composing the expected arguments to it, we can get away with not needing to mock most
       of the providers, since they will not be called upon.
     */
    renderWithAppContexts(h(EnvironmentsPage));

    // Assert
    screen.getByText('Cloud Environments');
    expect(Environments).toBeCalledTimes(1);
    expect(Environments).toBeCalledWith(
      expect.objectContaining({
        nav: navProvider,
        useWorkspaces: useWorkspaces as UseWorkspaces,
        leoAppData: leoAppProvider,
        leoRuntimeData: leoRuntimeProvider,
        leoDiskData: leoDiskProvider,
        permissions: leoResourceDeletable,
      } satisfies EnvironmentsProps),
      expect.anything()
    );
  });

  it('forwards dataRefresh to metrics event', () => {
    // Arrange
    const mockMetricsProvider: MetricsProvider = {
      captureEvent: jest.fn(),
    };
    asMockedFn(useMetricsEvent).mockReturnValue(mockMetricsProvider);
    const refreshInfo: DataRefreshInfo = {
      leoCallTimeMs: 100,
      totalCallTimeMs: 100,
      apps: 1,
      disks: 2,
      runtimes: 3,
    };
    asMockedFn(Environments).mockImplementation((props: EnvironmentsProps): React.ReactNode => {
      props.onEvent && props.onEvent('dataRefresh', refreshInfo);
      return 'Mock Environments';
    });
    // Act
    renderWithAppContexts(h(EnvironmentsPage));

    // Assert
    expect(mockMetricsProvider.captureEvent).toBeCalledTimes(1);
    expect(mockMetricsProvider.captureEvent).toBeCalledWith(Events.cloudEnvironmentDetailsLoad, refreshInfo);
  });
});

describe('Environments Page navProvider', () => {
  it('handles view-workspace getUrl()', () => {
    // Arrange
    const mockNav: TerraNavLinkProvider = {
      goToPath: jest.fn(),
      getLink: jest.fn(),
    };
    const pageNav = makeNavProvider(mockNav);

    // Act
    pageNav.getUrl('workspace-view', { name: 'myName', namespace: 'myNamespace' });

    // Assert
    expect(mockNav.getLink).toBeCalledTimes(1);
    expect(mockNav.getLink).toBeCalledWith(terraNavKey('workspace-dashboard'), {
      name: 'myName',
      namespace: 'myNamespace',
    });
  });

  it('handles view-workspace navTo()', () => {
    // Arrange
    const mockNav: TerraNavLinkProvider = {
      goToPath: jest.fn(),
      getLink: jest.fn(),
    };
    const pageNav = makeNavProvider(mockNav);

    // Act
    pageNav.navTo('workspace-view', { name: 'myName', namespace: 'myNamespace' });

    // Assert
    expect(mockNav.goToPath).toBeCalledTimes(1);
    expect(mockNav.goToPath).toBeCalledWith(terraNavKey('workspace-dashboard'), {
      name: 'myName',
      namespace: 'myNamespace',
    });
  });
});
