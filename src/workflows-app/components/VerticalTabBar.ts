import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';
import { VerticalNavigation } from 'src/components/keyboard-nav';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

const styles = {
  tabBar: {
    container: {
      ...Style.tabBar.container,
      paddingRight: 0,
      borderRight: Style.tabBar.container.borderBottom,
      borderBottom: 'none',
    },
    tab: {
      ...Style.tabBar.tab,
    },
    active: {
      ...Style.tabBar.active,
      borderBottomWidth: 0,
      borderBottom: 'none',
      borerBottomColor: 'transparent',
      borderRightWidth: Style.tabBar.active.borderBottomWidth,
      borderRightStyle: Style.tabBar.active.borderBottomStyle,
      borderRightColor: Style.tabBar.active.borderBottomColor,
    },
    hover: {
      ...Style.tabBar.hover,
    },
  },
};

export type VerticalTabBarProps = {
  activeTabKey: string;
  tabKeys: string[]; // unique keys for each tab
  tabDisplayNames?: Map<string, string>; // map of unique tab keys to display names. If not provided, tab keys will be used as display names
  tabTooltips?: Map<string, string>; // map of unique tab keys to tooltip text
  maxHeight?: number;
  onClick: (tabKey: string) => void;
};

export function VerticalTabBar(verticalTabProps: VerticalTabBarProps) {
  const { activeTabKey, tabKeys, tabDisplayNames, tabTooltips, maxHeight, onClick, ...props } = verticalTabProps;
  const [activeTab, setActiveTab] = useState(activeTabKey);
  const tabHeight = 60;

  const navTab = (i, currentTab) => {
    const selected: boolean = currentTab === activeTab;
    // We add a green border to the right of the active tab to make it look like it's selected
    // Subtract that border from the padding-right of the active tab to keep the tab width consistent
    const desiredPaddingRight = 10;
    const buttonPadding = selected ? desiredPaddingRight - styles.tabBar.active.borderRightWidth : desiredPaddingRight;
    const onClickFn = () => {
      setActiveTab(currentTab);
      onClick(currentTab);
    };
    return div(
      {
        key: currentTab,
        role: 'menuitem',
        'aria-setsize': tabKeys.length,
        'aria-posinset': i + 1, // The first tab is 1
        'aria-current': selected ? 'location' : undefined,
        style: {
          display: 'flex',
          width: '100%',
          height: tabHeight,
          padding: '0 0px',
        },
      },
      [
        h(
          Clickable,
          {
            style: {
              ...styles.tabBar.tab,
              ...(selected ? styles.tabBar.active : {}),
              height: tabHeight,
              justifyContent: 'left',
              width: '100%',
              paddingRight: buttonPadding,
            },
            hover: selected ? {} : styles.tabBar.hover,
            onClick: onClickFn,
          },
          [
            div(
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  alignContent: 'left',
                  width: '100%',
                  marginRight: '5px',
                },
              },
              [
                tabDisplayNames ? tabDisplayNames.get(currentTab) || currentTab : currentTab,
                !_.isEmpty(tabTooltips?.get(currentTab))
                  ? h(
                      InfoBox,
                      {
                        tooltip: undefined,
                        size: undefined,
                        side: undefined,
                      },
                      [tabTooltips?.get(currentTab) || '']
                    )
                  : undefined,
              ]
            ),
          ]
        ),
      ]
    );
  };

  return div(
    {
      style: {
        ...styles.tabBar.container,
        display: 'flex',
        flexDirection: 'column',
        height: _.min([tabKeys.length * tabHeight, maxHeight]),
        overflowY: 'scroll',
      },
    },
    [
      div(
        {
          role: 'navigation',
          'aria-label': props['aria-label'], // duplicate the menu's label on the navigation element
          'aria-labelledby': props['aria-labelledby'],
          style: { display: 'flex', flexDirection: 'column', width: '100%' },
        },
        [
          h(
            VerticalNavigation,
            {
              role: 'menu',
              'aria-orientation': 'vertical',
              style: { display: 'flex', flexDirection: 'column', width: '100%' },
              ...props,
            },
            [..._.map(([i, name]) => navTab(i, name), Utils.toIndexPairs(tabKeys))]
          ),
        ]
      ),
    ]
  );
}
