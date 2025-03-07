import _ from 'lodash/fp';
import PropTypes from 'prop-types';
import React from 'react';
import { Clickable } from 'src/components/common';
import { HorizontalNavigation } from 'src/components/keyboard-nav';
import { terraSpecial } from 'src/libs/colors';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

const styles = {
  tabWizard: {
    container: {
      display: 'flex',
      alignItems: 'center',
      fontWeight: 400,
      textTransform: 'uppercase',
      height: '2.25rem',
      borderBottom: `1px solid ${terraSpecial()}`,
      flex: '',
    },
    tab: {
      flex: 'none',
      padding: '0 1em',
      marginBottom: '8px',
      height: '100%',
      alignSelf: 'stretch',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 8,
      borderBottomStyle: 'solid',
      borderBottomColor: 'transparent',
    },
    active: {
      borderBottomColor: terraSpecial(),
      borderBottomWidth: 12,
      fontWeight: 600,
    },
    progressBar: {
      height: '4px',
      backgroundColor: `${terraSpecial()}`,
      transition: 'width 0.3s ease-in-out',
    },
  },
};

/**
 * Creates the primary tab bar for workspaces and workflows.
 * Semantically, this is actually a menu of links rather than true tabs.
 *
 * @param activeTab The key of the active tab
 * @param tabNames An array of keys for each tab
 * @param displayNames An optional mapping of display names for each tab (otherwise the keys will be displayed)
 * @param getOnClick An optional click handler function, given the current tab
 * @param aria-label The ARIA label for the menu, which is required for accessibility
 * @param tabProps Optionally, properties to add to each tab
 * @param children Children, which will be appended to the end of the tab bar
 * @param props Any additional properties to add to the container menu element
 */
export function TabWizard({
  activeTab,
  tabNames,
  tabsDisabled = [false, false, false],
  displayNames = {},
  getOnClick = _.noop,
  children,
  ...props
}) {
  const navTab = (i, currentTab) => {
    const selected = currentTab === activeTab;

    return (
      <span
        key={currentTab}
        role='menuitem'
        aria-setsize={tabNames.length}
        aria-posinset={i + 1} // The first tab is 1
        aria-current={selected ? 'location' : undefined}
        style={{
          display: 'flex',
          minWidth: 140,
          flexGrow: 0,
          alignSelf: 'stretch',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Clickable
          style={{ ...Style.tabBar.tab, ...(selected ? { fontWeight: 'bold' } : {}) }}
          hover={tabsDisabled[i] || selected ? {} : { backgroundColor: terraSpecial(0.2) }}
          onClick={() => (!tabsDisabled[i] ? getOnClick(currentTab) : null)}
        >
          <div
            style={{
              flex: '1 1 100%',
              marginBottom: selected ? -Style.tabBar.active.borderBottomWidth : undefined,
            }}
          >
            {displayNames[currentTab] || currentTab}
          </div>
        </Clickable>
      </span>
    );
  };

  const progressBarWidth = `${((tabNames.indexOf(activeTab) + 1) / tabNames.length) * 100}%`;

  return (
    <div style={{ ...Style.tabBar.container, borderBottom: 'none', flexDirection: 'column', paddingRight: 'none' }}>
      <nav
        aria-label={props['aria-label']} // duplicate the menu's label on the navigation element
        aria-labelledby={props['aria-labelledby']}
        style={{ display: 'flex', flexGrow: 1, height: '100%' }}
      >
        <HorizontalNavigation
          role='menu'
          aria-orientation='horizontal'
          style={{ display: 'flex', flexDirection: 'row', textTransform: 'none' }}
        >
          {_.map(([i, name]) => navTab(i, name), Utils.toIndexPairs(tabNames))}
        </HorizontalNavigation>
      </nav>
      <div style={{ display: 'flex', flexGrow: 0, alignItems: 'center' }}>{children}</div>
      <div style={{ width: '100%', backgroundColor: '#e0e0e0', height: '4px', position: 'relative' }}>
        <div style={{ ...styles.tabWizard.progressBar, width: progressBarWidth }} />
      </div>
    </div>
  );
}
TabWizard.propTypes = {
  activeTab: PropTypes.string,
  tabNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  displayNames: PropTypes.object,
  getOnClick: PropTypes.func,
  tabProps: PropTypes.object,
  id: PropTypes.string,
};
