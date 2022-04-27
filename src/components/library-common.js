import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { TabBar } from 'src/components/tabBars'
import TopBar from 'src/components/TopBar'
import { isDataBrowserVisible, isGPDataSelectorVisible } from 'src/libs/config'
import * as Nav from 'src/libs/nav'


const TAB_LINKS = {
  datasets: 'library-datasets',
  'featured workspaces': 'library-showcase',
  ...(isDataBrowserVisible() ? { 'browse & explore': 'library-browser' } : {}),
  ...(isGPDataSelectorVisible() ? { 'gp data selector': 'library-gp-selector' } : {}),
  'code & workflows': 'library-code'
}

export const libraryTopMatter = activeTab => h(Fragment, [
  h(TopBar, { title: 'Library', href: Nav.getLink('root') }),
  h(TabBar, {
    'aria-label': 'library menu',
    activeTab,
    tabNames: _.keys(TAB_LINKS),
    getHref: currentTab => Nav.getLink(TAB_LINKS[currentTab])
  })
])
