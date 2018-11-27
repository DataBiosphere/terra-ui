import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { contextBar } from 'src/components/common'
import TopBar from 'src/components/TopBar'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'


const styles = {
  tabContainer: {
    paddingLeft: '5rem', borderBottom: `5px solid ${colors.blue[0]}`,
    color: 'white', textTransform: 'uppercase'
  },
  tab: {
    maxWidth: 140, flexGrow: 1, color: colors.gray[4],
    alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.15)', color: 'unset',
    borderBottom: `4px solid ${colors.blue[0]}`, fontWeight: 'bold'
  }
}

const navSeparator = div({
  style: { background: 'rgba(255,255,255,0.15)', width: 1, height: '3rem', flexShrink: 0 }
})

const TAB_NAMES = ['datasets', 'showcase', 'code']


export const wrapLibrary = activeTab => WrappedComponent => {
  const navTab = currentTab => {
    const selected = currentTab === activeTab
    const href = Nav.getLink(_.kebabCase(`library ${currentTab}`))
    const hideSeparator = selected || TAB_NAMES.indexOf(activeTab) === TAB_NAMES.indexOf(currentTab) + 1

    return h(Fragment, [
      a({
        style: { ...styles.tab, ...(selected ? styles.activeTab : {}) },
        href
      }, currentTab),
      !hideSeparator && navSeparator
    ])
  }

  return h(Fragment, [
    h(TopBar, { title: 'Library', href: Nav.getLink('root') }),
    contextBar({ style: styles.tabContainer }, [
      activeTab !== TAB_NAMES[0] && navSeparator,
      ..._.map(name => navTab(name), TAB_NAMES)
    ]),
    div({ style: styles.childrenContainer }, [
      h(WrappedComponent)
    ])
  ])
}
