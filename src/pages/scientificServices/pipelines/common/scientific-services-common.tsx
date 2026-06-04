import _ from 'lodash/fp';
import React from 'react';
import { TabBar } from 'src/components/tabBars';
import * as Nav from 'src/libs/nav';
import { ScientificServicesSidebar } from 'src/pages/scientificServices/pipelines/common/ScientificServicesSidebar';

export const SCIENTIFIC_SERVICES_SUPPORT_EMAIL = 'scientific-services-support@broadinstitute.org';

const JOBS_TAB_LINKS = {
  'run job': 'pipelines-run',
  'job history': 'pipelines-history',
  about: 'pipelines-about',
};

const ACCOUNT_TAB_LINKS = {
  profile: 'pipelines-profile',
  quotas: 'pipelines-quotas',
};

export const pipelinesTopBar = (activeTab?: string) => {
  const isAccountTab = activeTab && Object.values(ACCOUNT_TAB_LINKS).includes(activeTab);

  const tabLinks = isAccountTab ? ACCOUNT_TAB_LINKS : JOBS_TAB_LINKS;

  return (
    <>
      <ScientificServicesSidebar title='' href={Nav.getLink('root')} />
      <TabBar
        aria-label='pipelines menu'
        styleOverrides={{
          tab: {
            backgroundColor: '#ffffff',
          },
          active: {
            backgroundColor: '#e3f1fc',
            borderBottom: '4px solid #46A3E9',
          },
          hover: {
            backgroundColor: '#f5f5f5',
          },
          container: {
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #46A3E9',
          },
        }}
        activeTab={activeTab}
        tabNames={_.keys(tabLinks)}
        getHref={(currentTab) => {
          return Nav.getLink(tabLinks[currentTab]);
        }}
      >
        {/* TabBar doesn't need any children */}
        {null}
      </TabBar>
    </>
  );
};
