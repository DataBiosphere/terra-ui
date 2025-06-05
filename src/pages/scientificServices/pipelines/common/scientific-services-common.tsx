import _ from 'lodash/fp';
import React from 'react';
import { TabBar } from 'src/components/tabBars';
import { TopBar } from 'src/components/TopBar';
import * as Nav from 'src/libs/nav';

const TAB_LINKS = {
  home: 'pipelines-home',
  'run job': 'pipelines-run',
  'job history': 'pipelines-history',
};

export const pipelinesTopBar = (activeTab: string) => {
  return (
    <>
      <TopBar title='' href={Nav.getLink('root')} />
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
    </>
  );
};
