import { NavLinkProvider } from '@terra-ui-packages/core-utils';
import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { EnvironmentNavActions, Environments } from 'src/analysis/Environments/Environments';
import FooterWrapper from 'src/components/FooterWrapper';
import SupportRequestWrapper from 'src/components/SupportRequest';
import { TopBar } from 'src/components/TopBar';
import { leoAppProvider } from 'src/libs/ajax/leonardo/providers/LeoAppProvider';
import { leoDiskProvider } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { leoRuntimeProvider } from 'src/libs/ajax/leonardo/providers/LeoRuntimeProvider';
import { useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics';
import Events from 'src/libs/events';
import { terraNavKey, TerraNavLinkProvider, terraNavLinkProvider } from 'src/libs/nav';
import { contactUsActive } from 'src/libs/state';
import { leoResourcePermissions } from 'src/pages/EnvironmentsPage/environmentsPermissions';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';

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
  const metrics = useMetricsEvent();
  return h(FooterWrapper, [
    h(TopBar, { title: 'Cloud Environments', href: '' }, []),
    h(Environments, {
      nav: navProvider,
      useWorkspaces,
      leoAppData: leoAppProvider,
      leoRuntimeData: leoRuntimeProvider,
      leoDiskData: leoDiskProvider,
      permissions: leoResourcePermissions,
      onEvent: (eventName, eventArgs) => {
        switch (eventName) {
          case 'dataRefresh':
            metrics.captureEvent(Events.cloudEnvironmentDetailsLoad, eventArgs);
            break;
          default:
            break;
        }
      },
    }),
    contactUsActive.get() && h(SupportRequestWrapper),
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
