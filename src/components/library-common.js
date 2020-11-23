import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { TabBar } from 'src/components/common'
import * as Nav from 'src/libs/nav'


const TAB_LINKS = { datasets: 'library-datasets', 'showcase & tutorials': 'library-showcase', 'code & workflows': 'library-code' }

export const libraryTopMatter = activeTab => h(Fragment, [
  h(TabBar, {
    activeTab,
    tabNames: _.keys(TAB_LINKS),
    getHref: currentTab => Nav.getLink(TAB_LINKS[currentTab])
  })
])
