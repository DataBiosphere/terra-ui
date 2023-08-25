import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Environments } from 'src/analysis/Environments/Environments';
import { terraNavKey, TerraNavLinkProvider } from 'src/libs/nav';
import { asMockedFn } from 'src/testing/test-utils';

import { EnvironmentsPage, makeNavProvider, navProvider } from './EnvironmentsPage';

jest.mock('src/analysis/Environments/Environments');

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
    // Note:
    // This test does not arrange or assert that Environments component rendered by
    // EnvironmentsPage is given the expected context, since the Ajax mechanics are expected
    // to soon be improved.  This test will be extended once those improvements are in.

    // ACT
    render(h(EnvironmentsPage));

    // ASSERT
    screen.getByText('Cloud Environments');
    const watcher = Environments;
    expect(watcher).toBeCalledTimes(1);
    expect(watcher).toBeCalledWith({ nav: navProvider }, expect.anything());
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
    pageNav.getUrl('view-workspace', { name: 'myName', namespace: 'myNamespace' });

    // Assert
    const watcher = asMockedFn(mockNav.getLink);
    expect(watcher).toBeCalledTimes(1);
    expect(watcher).toBeCalledWith(terraNavKey('workspace-dashboard'), { name: 'myName', namespace: 'myNamespace' });
  });

  it('handles view-workspace navTo()', () => {
    // Arrange
    const mockNav: TerraNavLinkProvider = {
      goToPath: jest.fn(),
      getLink: jest.fn(),
    };
    const pageNav = makeNavProvider(mockNav);

    // Act
    pageNav.navTo('view-workspace', { name: 'myName', namespace: 'myNamespace' });

    // Assert
    const watcher = asMockedFn(mockNav.goToPath);
    expect(watcher).toBeCalledTimes(1);
    expect(watcher).toBeCalledWith(terraNavKey('workspace-dashboard'), { name: 'myName', namespace: 'myNamespace' });
  });
});
