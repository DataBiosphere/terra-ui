import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Environments, EnvironmentsProps } from 'src/analysis/Environments/Environments';
import { leoAppProvider } from 'src/libs/ajax/leonardo/providers/LeoAppProvider';
import { leoDiskProvider } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { leoRuntimeProvider } from 'src/libs/ajax/leonardo/providers/LeoRuntimeProvider';
import { MetricsProvider, useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics';
import { terraNavKey, TerraNavLinkProvider } from 'src/libs/nav';
import { environmentsPermissions } from 'src/pages/EnvironmentsPage/environmentsPermissions';
import { asMockedFn } from 'src/testing/test-utils';
import { useWorkspaces } from 'src/workspaces/useWorkspaces';
import { UseWorkspaces } from 'src/workspaces/useWorkspaces.models';

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

type TopBarExports = typeof import('src/components/TopBar') & { __esModule: true };
jest.mock(
  'src/components/TopBar',
  (): TopBarExports => ({
    __esModule: true,
    default: (props) => {
      const { div } = jest.requireActual('react-hyperscript-helpers');
      return div([props.title]);
    },
  })
);

describe('Environments Page', () => {
  it('renders Environments component with correct args', () => {
    // Arrange
    const mockMetricsProvider: MetricsProvider = {
      captureEvent: jest.fn(),
    };
    asMockedFn(useMetricsEvent).mockReturnValue(mockMetricsProvider);

    // Act
    /* Note: Because we are mocking the inner Environments component and just testing that we
       are composing the expected arguments to it, we can get away with not needing to mock most
       of the providers, since they will not be called upon.
     */
    render(h(EnvironmentsPage));

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
        permissions: environmentsPermissions,
        metrics: mockMetricsProvider,
      } satisfies EnvironmentsProps),
      expect.anything()
    );
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
