import _ from 'lodash/fp';
import React from 'react';
import { TabBar } from 'src/components/tabBars';
import { TopBar } from 'src/components/TopBar';
import * as Nav from 'src/libs/nav';

const TAB_LINKS = {
  home: 'imputation-home',
  'run job': 'imputation-run',
  'job history': 'imputation-history',
};

export const imputationTopBar = (activeTab: string) => {
  return (
    <>
      {/* TODO: TSPS-486 TopBar.showMenu should be false */}
      <TopBar title='' href={Nav.getLink('root')} />
      <TabBar
        aria-label='imputation menu'
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
