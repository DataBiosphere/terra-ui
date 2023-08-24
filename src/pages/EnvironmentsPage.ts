import { h } from 'react-hyperscript-helpers';
import { Environments } from 'src/analysis/Environments/Environments';
import FooterWrapper from 'src/components/FooterWrapper';
import TopBar from 'src/components/TopBar';
import * as Nav from 'src/libs/nav';

export const EnvironmentsPage = () =>
  h(FooterWrapper, [
    h(TopBar, { title: 'Cloud Environments', href: '' }, []),
    // Passing Nav here allows overriding when this component is used outside of Terra UI.
    h(Environments, { nav: Nav }),
  ]);

export const navPaths = [
  {
    name: 'environments',
    path: '/clusters', // NB: This path name is a holdover from a previous naming scheme
    component: EnvironmentsPage,
    title: 'Cloud environments',
  },
];
