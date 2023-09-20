import { Theme, ThemeProvider, ThemeProviderProps } from '@terra-ui-packages/components';
import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { getEnabledBrand } from 'src/libs/brand-utils';
import { BrandConfiguration } from 'src/libs/brands';
import { reportError } from 'src/libs/error';
import { Router } from 'src/libs/nav';
import { asMockedFn } from 'src/testing/test-utils';

import Main from './Main';

type RoutesExports = typeof import('src/libs/routes');
jest.mock('src/libs/routes', (): RoutesExports => ({}));

type ComponentsExports = typeof import('@terra-ui-packages/components');
jest.mock('@terra-ui-packages/components', (): ComponentsExports => {
  return {
    ...jest.requireActual<ComponentsExports>('@terra-ui-packages/components'),
    ThemeProvider: jest.fn().mockImplementation(({ children }) => children),
  };
});

type ReactNotificationsComponentExports = typeof import('react-notifications-component');
jest.mock('react-notifications-component', (): ReactNotificationsComponentExports => {
  return {
    ...jest.requireActual<ReactNotificationsComponentExports>('react-notifications-component'),
    ReactNotifications: jest.fn().mockReturnValue(null),
  };
});

type ReactOIDCContextExports = typeof import('react-oidc-context');
jest.mock('react-oidc-context', (): ReactOIDCContextExports => {
  return {
    ...jest.requireActual<ReactOIDCContextExports>('react-oidc-context'),
    AuthProvider: jest.fn().mockImplementation(({ children }) => children),
  };
});

type RuntimeCommonComponentsExports = typeof import('src/analysis/runtime-common-components');
jest.mock('src/analysis/runtime-common-components', (): RuntimeCommonComponentsExports => {
  return {
    ...jest.requireActual<RuntimeCommonComponentsExports>('src/analysis/runtime-common-components'),
    AuthenticatedCookieSetter: jest.fn().mockImplementation(({ children }) => children),
  };
});

type AuthContainerExports = typeof import('src/components/AuthContainer') & { __esModule: true };
jest.mock('src/components/AuthContainer', (): AuthContainerExports => {
  return {
    ...jest.requireActual<AuthContainerExports>('src/components/AuthContainer'),
    default: jest.fn().mockImplementation(({ children }) => children),
    __esModule: true,
  };
});

type AuthStoreSetterExports = typeof import('src/components/AuthStoreSetter') & { __esModule: true };
jest.mock('src/components/AuthStoreSetter', (): AuthStoreSetterExports => {
  return {
    ...jest.requireActual<AuthStoreSetterExports>('src/components/AuthStoreSetter'),
    default: jest.fn().mockImplementation(({ children }) => children),
    __esModule: true,
  };
});

type ConfigOverridesWarningExports = typeof import('src/components/ConfigOverridesWarning') & { __esModule: true };
jest.mock('src/components/ConfigOverridesWarning', (): ConfigOverridesWarningExports => {
  return {
    ...jest.requireActual<ConfigOverridesWarningExports>('src/components/ConfigOverridesWarning'),
    default: jest.fn().mockReturnValue(null),
    __esModule: true,
  };
});

type CookieRejectModalExports = typeof import('src/components/CookieRejectModal') & { __esModule: true };
jest.mock('src/components/CookieRejectModal', (): CookieRejectModalExports => {
  return {
    ...jest.requireActual<CookieRejectModalExports>('src/components/CookieRejectModal'),
    default: jest.fn().mockReturnValue(null),
    __esModule: true,
  };
});

type CookieWarningExports = typeof import('src/components/CookieWarning') & { __esModule: true };
jest.mock('src/components/CookieWarning', (): CookieWarningExports => {
  return {
    ...jest.requireActual<CookieWarningExports>('src/components/CookieWarning'),
    default: jest.fn().mockReturnValue(null),
    __esModule: true,
  };
});

type FirecloudNotificationExports = typeof import('src/components/FirecloudNotification') & { __esModule: true };
jest.mock('src/components/FirecloudNotification', (): FirecloudNotificationExports => {
  return {
    ...jest.requireActual<FirecloudNotificationExports>('src/components/FirecloudNotification'),
    default: jest.fn().mockReturnValue(null),
    __esModule: true,
  };
});

type IdleStatusMonitorExports = typeof import('src/components/IdleStatusMonitor') & { __esModule: true };
jest.mock('src/components/IdleStatusMonitor', (): IdleStatusMonitorExports => {
  return {
    ...jest.requireActual<IdleStatusMonitorExports>('src/components/IdleStatusMonitor'),
    default: jest.fn().mockReturnValue(null),
    __esModule: true,
  };
});

type SupportRequestExports = typeof import('src/components/SupportRequest') & { __esModule: true };
jest.mock('src/components/SupportRequest', (): SupportRequestExports => {
  return {
    ...jest.requireActual<SupportRequestExports>('src/components/SupportRequest'),
    default: jest.fn().mockReturnValue(null),
    __esModule: true,
  };
});

type TitleManagerExports = typeof import('src/components/TitleManager');
jest.mock('src/components/TitleManager', (): TitleManagerExports => {
  return {
    ...jest.requireActual<TitleManagerExports>('src/components/TitleManager'),
    TitleManager: jest.fn().mockReturnValue(null),
  };
});

type ImportStatusExports = typeof import('src/data/ImportStatus') & { __esModule: true };
jest.mock('src/data/ImportStatus', (): ImportStatusExports => {
  return {
    ...jest.requireActual<ImportStatusExports>('src/data/ImportStatus'),
    default: jest.fn().mockReturnValue(null),
    __esModule: true,
  };
});

type BrandUtilsExports = typeof import('src/libs/brand-utils');
jest.mock('src/libs/brand-utils', (): BrandUtilsExports => {
  const { defaultBrand } = jest.requireActual('src/libs/brands');
  return {
    ...jest.requireActual<BrandUtilsExports>('src/libs/brand-utils'),
    getEnabledBrand: jest.fn().mockReturnValue(defaultBrand),
    isBrand: jest.fn().mockImplementation((brand) => brand === defaultBrand),
  };
});

type ErrorExports = typeof import('src/libs/error');
jest.mock('src/libs/error', (): ErrorExports => {
  return {
    ...jest.requireActual<ErrorExports>('src/libs/error'),
    reportError: jest.fn(),
  };
});

type EventsExports = typeof import('src/libs/events');
jest.mock('src/libs/events', (): EventsExports => {
  return {
    ...jest.requireActual<EventsExports>('src/libs/events'),
    PageViewReporter: jest.fn().mockReturnValue(null),
  };
});

type NavExports = typeof import('src/libs/nav');
jest.mock('src/libs/nav', (): NavExports => {
  return {
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getCurrentUrl: jest.fn().mockReturnValue(''),
    LocationProvider: jest.fn().mockImplementation(({ children }) => children),
    PathHashInserter: jest.fn().mockReturnValue(null),
    Router: jest.fn().mockReturnValue(null),
  };
});

describe('Main', () => {
  describe('theme', () => {
    it('renders ThemeProvider with theme from enabled brand', () => {
      // Arrange
      const mockTheme: Theme = {} as Theme;
      const mockBrandConfiguration: Partial<BrandConfiguration> = { theme: mockTheme };
      asMockedFn(getEnabledBrand).mockReturnValue(mockBrandConfiguration as BrandConfiguration);

      // Act
      render(h(Main));

      // Assert
      expect(ThemeProvider).toHaveBeenCalledWith(
        expect.objectContaining({ theme: mockTheme } satisfies ThemeProviderProps),
        expect.anything()
      );
    });
  });

  describe('error boundary', () => {
    it('reports render errors', () => {
      // Arrange
      const MisbehavingComponent = () => {
        throw new Error('Something went wrong!');
      };

      // Prevent React from logging the error.
      jest.spyOn(console, 'error').mockImplementation(() => {});

      asMockedFn(Router).mockImplementation(() => {
        return h(MisbehavingComponent);
      });

      // Act
      render(h(Main));

      // Assert
      expect(reportError).toHaveBeenCalledWith('An error occurred', new Error('Something went wrong!'));
    });
  });
});
