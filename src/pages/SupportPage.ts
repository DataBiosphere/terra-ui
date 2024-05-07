// import _ from 'lodash/fp';
import { h, h2, p } from 'react-hyperscript-helpers';
import FooterWrapper from 'src/components/FooterWrapper';
import { PageBox } from 'src/components/PageBox';
import TopBar from 'src/components/TopBar';
import * as Style from 'src/libs/style';
import { SupportResourceList } from 'src/support/SupportResourceList';

interface SupportPageProps {
  queryParams: {
    selectedType: string | undefined;
    resourceName: string | undefined;
  };
}

const SupportPage = (props: SupportPageProps) => {
  const selectedType = props.queryParams.selectedType;
  const resourceName = props.queryParams.resourceName;

  return h(FooterWrapper, [
    h(TopBar, { title: 'Support' }),
    h(PageBox, { role: 'main' }, [
      h2({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Support']),
      p(['Select resource type.']),
      h(SupportResourceList, { queryParams: { selectedType, resourceName } }),
    ]),
  ]);
};

export const navPaths = [
  {
    name: 'support',
    path: '/support',
    component: SupportPage,
    title: 'Support',
  },
];
