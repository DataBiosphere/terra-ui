import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { tabBar } from 'src/components/common'
import TopBar from 'src/components/TopBar'
import * as Nav from 'src/libs/nav'


const TAB_NAMES = ['datasets', 'showcase & tutorials', 'code & tools']

export const libraryTopMatter = activeTab => h(Fragment, [
  h(TopBar, { title: 'Library', href: Nav.getLink('root') }),
  tabBar({
    activeTab,
    tabNames: TAB_NAMES,
    getHref: currentTab => Nav.getLink(_.kebabCase(`library ${currentTab.split(' ')[0]}`))
  })
])
