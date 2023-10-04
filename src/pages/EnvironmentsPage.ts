import { NavLinkProvider } from '@terra-ui-packages/core-utils';
import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { EnvironmentNavActions, Environments, UseWorkspacesState } from 'src/analysis/Environments/Environments';
import FooterWrapper from 'src/components/FooterWrapper';
import TopBar from 'src/components/TopBar';
import { useWorkspaces } from 'src/components/workspace-utils';
import { leoAppProvider } from 'src/libs/ajax/leonardo/providers/LeoAppProvider';
import { leoDiskProvider } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { leoRuntimeProvider } from 'src/libs/ajax/leonardo/providers/LeoRuntimeProvider';
import { useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics';
import { terraNavKey, TerraNavLinkProvider, terraNavLinkProvider } from 'src/libs/nav';

type NavMap<NavTypes, FnReturn> = {
  [Property in keyof NavTypes]: (args: NavTypes[Property]) => FnReturn;
};

export const makeNavProvider = (terraNav: TerraNavLinkProvider): NavLinkProvider<EnvironmentNavActions> => {
  const { getLink, goToPath } = terraNav;
  const myNav: NavLinkProvider<EnvironmentNavActions> = {
    getUrl: <K extends keyof EnvironmentNavActions>(navKey: K, navArgs: EnvironmentNavActions[K]): string => {
      const navMap: NavMap<EnvironmentNavActions, string> = {
        'workspace-view': (args) => getLink(terraNavKey('workspace-dashboard'), args),
      };
      return navMap[navKey](navArgs);
    },
    navTo: <K extends keyof EnvironmentNavActions>(navKey: K, navArgs: EnvironmentNavActions[K]): void => {
      const navMap: NavMap<EnvironmentNavActions, void> = {
        'workspace-view': (args) => goToPath(terraNavKey('workspace-dashboard'), args),
      };
      return navMap[navKey](navArgs);
    },
  };
  return myNav;
};

export const navProvider = makeNavProvider(terraNavLinkProvider);

export const EnvironmentsPage = (): ReactNode => {
  const metricsProvider = useMetricsEvent();
  return h(FooterWrapper, [
    h(TopBar, { title: 'Cloud Environments', href: '' }, []),
    h(Environments, {
      nav: navProvider,
      useWorkspacesState: useWorkspaces as UseWorkspacesState,
      leoAppData: leoAppProvider,
      leoRuntimeData: leoRuntimeProvider,
      leoDiskData: leoDiskProvider,
      metrics: metricsProvider,
    }),
  ]);
};

export const navPaths = [
  {
    name: 'environments',
    path: '/clusters', // NB: This path name is a holdover from a previous naming scheme
    component: EnvironmentsPage,
    title: 'Cloud environments',
  },
];
