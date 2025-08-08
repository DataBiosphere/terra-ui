import _ from 'lodash/fp';
import React from 'react';
import { TabBar } from 'src/components/tabBars';
import { TopBar } from 'src/components/TopBar';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { IMPUTATION_UI } from 'src/libs/feature-previews-config';
import * as Nav from 'src/libs/nav';

export const SCIENTIFIC_SERVICES_SUPPORT_EMAIL = 'scientific-services-support@broadinstitute.org';

const TAB_LINKS = {
  'run job': 'pipelines-run',
  'job history': 'pipelines-history',
  about: 'pipelines-about',
};

export const pipelinesTopBar = (activeTab: string) => {
  const isFeatureEnabled = !isFeaturePreviewEnabled(IMPUTATION_UI);

  return (
    <>
      <TopBar title='' href={Nav.getLink('root')} />
      {isFeatureEnabled && (
        <TabBar
          aria-label='pipelines menu'
          activeTab={activeTab}
          tabNames={_.keys(TAB_LINKS)}
          getHref={(currentTab) => {
            return Nav.getLink(TAB_LINKS[currentTab]);
          }}
        >
          {/* TabBar doesn't need any children */}
          {null}
        </TabBar>
      )}
    </>
  );
};
