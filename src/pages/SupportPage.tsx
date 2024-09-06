import React from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import { TopBar } from 'src/components/TopBar';
import * as Nav from 'src/libs/nav';
import * as Style from 'src/libs/style';
import { SupportResourceList } from 'src/support/SupportResourceList';

interface SupportPageProps {
  queryParams: {
    resourceType: string | undefined;
    resourceId: string | undefined;
  };
}

const SupportPage = (props: SupportPageProps) => {
  const selectedType = props.queryParams.resourceType;
  const resourceId = props.queryParams.resourceId;
  const breadcrumbs = `Support > ${selectedType}`;

  return (
    <FooterWrapper>
      <TopBar title='Support' href={Nav.getLink('support')}>
        {resourceId && (
          <div style={Style.breadcrumb.breadcrumb}>
            <div style={Style.noWrapEllipsis}>{breadcrumbs}</div>
            <div style={Style.breadcrumb.textUnderBreadcrumb}>{resourceId}</div>
          </div>
        )}
      </TopBar>
      <PageBox role='main' variant={PageBoxVariants.light}>
        <h2 style={{ ...Style.elements.sectionHeader, textTransform: 'uppercase' }}>Support</h2>
        <p>Select resource type.</p>
        <SupportResourceList queryParams={{ resourceType: selectedType, resourceId }} />
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
