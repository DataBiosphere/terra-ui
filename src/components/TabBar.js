import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, useRef } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { withHorizontalNavigation } from 'src/components/keyboard-nav'
import { terraSpecial } from 'src/libs/colors'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  tabBar: {
    container: {
      display: 'flex', alignItems: 'center',
      fontWeight: 400, textTransform: 'uppercase',
      height: '2.25rem',
      borderBottom: `1px solid ${terraSpecial()}`, flex: ''
    },
    tab: {
      flex: 'none', padding: '0 1em', height: '100%',
      alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center',
      borderBottomWidth: 8, borderBottomStyle: 'solid', borderBottomColor: 'transparent'
    },
    active: {
      borderBottomColor: terraSpecial(),
      fontWeight: 600
    }
  }
}

/**
 * Creates the primary tab bar for workspaces and workflows.
 * Semantically, this is actually a menu of links rather than true tabs.
 *
 * @param activeTab The key of the active tab
 * @param tabNames An array of keys for each tab
 * @param displayNames An optional array of display names for each tab (otherwise the keys will be displayed)
 * @param refresh If provided, a function to refresh the current tab
 * @param getHref A function to get the href for a given tab
 * @param getOnClick An optional click handler function, given the current tab
 * @param label The ARIA label for the menu, which is required for accessibility
 * @param tabProps Optionally, properties to add to each tab
 * @param id Optionally, an ID to apply to the wrapper `nav` element so it can be easily found in the
 *  integration tests. This defaults to 'tab-navigation', but you should change if it this ID would appear
 *  more than once on a page
 * @param children Children, which will be appended to teh end of the tab bar
 * @param props Any additional properties to add to the container menu element
 */
export const TabBar = ({
  activeTab, tabNames, displayNames = {}, refresh = _.noop, getHref,
  getOnClick = _.noop, label, tabProps = {}, id = 'tab-navigation', children, ...props
}) => {
  Utils.useConsoleAssert(!!label, 'You must provide an accessible label for this tab bar')

  const navTab = (i, currentTab) => {
    const selected = currentTab === activeTab
    const href = getHref(currentTab)

    return ({ forwardedRef, onKeyDown }) => span({
      key: currentTab,
      role: 'menuitem',
      'aria-setsize': tabNames.length,
      'aria-posinset': i + 1, // The first tab is 1
      'aria-current': selected ? 'location' : undefined,
      style: { display: 'flex', minWidth: 140, flexGrow: 0, alignSelf: 'stretch', alignItems: 'center', textAlign: 'center' }
    }, [
      h(Clickable, {
        style: { ...Style.tabBar.tab, ...(selected ? Style.tabBar.active : {}) },
        hover: selected ? {} : Style.tabBar.hover,
        onClick: href === window.location.hash ? refresh : getOnClick(currentTab),
        onKeyDown,
        ref: forwardedRef,
        href
      }, [
        div({ style: { flex: '1 1 100%', marginBottom: selected ? -(Style.tabBar.active.borderBottomWidth) : undefined } }, displayNames[currentTab] || currentTab)
      ])
    ])
  }

  return div({
    role: 'navigation',
    id
  }, [
    div({
      role: 'menu',
      'aria-label': label,
      'aria-orientation': 'horizontal',
      style: Style.tabBar.container,
      ...props
    }, [
      withHorizontalNavigation(_.map(([i, name]) => navTab(i, name), Utils.toIndexPairs(tabNames))),
      div({ style: { flexGrow: 1 } }),
      children
    ])
  ])
}
TabBar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  tabNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  displayNames: PropTypes.arrayOf(PropTypes.string),
  label: PropTypes.string.isRequired,
  refresh: PropTypes.func,
  getHref: PropTypes.func,
  getOnClick: PropTypes.func,
  tabProps: PropTypes.object,
  id: PropTypes.string
}

/**
 * Creates a small tab bar, visually smaller than the one created by TabBar.
 * This is semantically a tablist in that these components are generally used as filters for a table
 * rather than as lists of links. If children are provided, they will be considered to be part of the
 * tab panel. In this case, focus will be moved to the tab panel when the user clicks on a tab.
 *
 * @param value The key of the active tab
 * @param onChange A function to be called when the user clicks a tab
 * @param tabs An array of objects defining each tab
 * @param tabs[].key The key of the tab
 * @param tabs[].title The display name of the tab
 * @param tabs[].width Optionally the width at which to render the tab
 * @param label The ARIA label for the menu, which is required for accessibility
 * @param tabProps Optionally, properties to add to each tab
 * @param panelProps Optionally, properties to add to the tabpanel element
 * @param children Children, which will be appended to teh end of the tab bar
 * @param props Any additional properties to add to the container menu element
 */
export const SimpleTabBar = ({ value, onChange, tabs, label, tabProps = {}, panelProps = {}, children, ...props }) => {
  Utils.useConsoleAssert(!!label, 'You must provide an accessible label for this tab bar')

  const tabIds = _.map(Utils.useUniqueId, _.range(0, tabs.length))
  const panelRef = useRef()

  // Determine the index of the selected tab, or choose the first one
  const selectedId = Math.max(0, _.findIndex(({ key }) => key === value, tabs))

  return h(Fragment, [
    div({
      role: 'tablist',
      'aria-label': label,
      style: { ...styles.tabBar.container, flex: 0 },
      ...props
    }, withHorizontalNavigation(_.map(([i, { key, title, width }]) => {
      const selected = value === key
      return ({ forwardedRef, onKeyDown }) => h(Clickable, {
        key,
        ref: forwardedRef,
        id: tabIds[i],
        role: 'tab',
        'aria-posinset': i + 1, // The first tab is 1
        'aria-setsize': tabs.length,
        'aria-selected': selected,
        style: { ...styles.tabBar.tab, ...(selected ? styles.tabBar.active : {}), width },
        hover: selected ? {} : styles.tabBar.hover,
        onKeyDown,
        onClick: () => {
          // If any children were provided, move the focus to the tabpanel as soon as a tab is selected.
          // This most efficiently lets keyboard users interact with the tabs and find the content they care about.
          children && panelRef.current.focus()
          onChange && onChange(key)
        },
        ...tabProps
      }, [title])
    }, Utils.toIndexPairs(tabs)))),
    children && div({
      role: 'tabpanel',
      ref: panelRef,
      tabIndex: -1,
      'aria-labelledby': tabIds[selectedId],
      style: { flex: '1 1 auto', display: 'flex', flexFlow: 'column nowrap' },
      ...panelProps
    }, [children])
  ])
}
SimpleTabBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  tabs: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.node.isRequired,
    width: PropTypes.number
  })).isRequired,
  label: PropTypes.string.isRequired,
  tabProps: PropTypes.object,
  panelProps: PropTypes.object
}
