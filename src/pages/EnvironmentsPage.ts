import { NavLinkProvider } from '@terra-ui-packages/core-utils';
import { h } from 'react-hyperscript-helpers';
import { EnvironmentNavActions, Environments } from 'src/analysis/Environments/Environments';
import FooterWrapper from 'src/components/FooterWrapper';
import TopBar from 'src/components/TopBar';
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

export const EnvironmentsPage = () =>
  h(FooterWrapper, [
    h(TopBar, { title: 'Cloud Environments', href: '' }, []),
    // Passing Nav here allows overriding when this component is used outside of Terra UI.
    h(Environments, { nav: navProvider }),
  ]);

export const navPaths = [
  {
    name: 'environments',
    path: '/clusters', // NB: This path name is a holdover from a previous naming scheme
    component: EnvironmentsPage,
    title: 'Cloud environments',
  },
];
