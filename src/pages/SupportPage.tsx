import React from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import TopBar from 'src/components/TopBar';
import * as Nav from 'src/libs/nav';
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

  return (
    <FooterWrapper>
      <TopBar title="Support" href={Nav.getLink('support')} />
      <PageBox role="main" variant={PageBoxVariants.light}>
        <h2 style={{ ...Style.elements.sectionHeader, textTransform: 'uppercase' }}>Support</h2>
        <p>Select resource type.</p>
        <SupportResourceList queryParams={{ selectedType, resourceName }} />
      </PageBox>
    </FooterWrapper>
  );
};

export const navPaths = [
  {
    name: 'support',
    path: '/support',
    component: SupportPage,
    title: 'Support',
  },
];
