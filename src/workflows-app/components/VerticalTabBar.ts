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
      borderBottomStyle: 'none',
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

export function VerticalTabBar({
  activeTabKey,
  tabKeys,
  tabDisplayNames,
  tabTooltips,
  maxHeight,
  onClick,
  ...props
}: VerticalTabBarProps) {
  const [activeTab, setActiveTab] = useState(activeTabKey);
  const tabHeight = 60;
  const navTab = (i, currentTab) => {
    const selected: boolean = currentTab === activeTab;
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
          minWidth: 140,
          height: tabHeight,
          alignSelf: 'stretch',
          alignItems: 'center',
          textAlign: 'center',
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
              width: '100%',
            },
            hover: selected ? {} : styles.tabBar.hover,
            onClick: onClickFn,
          },
          [
            div(
              {
                style: {
                  flex: '1 1 100%',
                  marginRight: selected ? -styles.tabBar.active.borderRightWidth : undefined,
                },
              },
              [
                tabDisplayNames ? tabDisplayNames.get(currentTab) || currentTab : currentTab,
                !_.isEmpty(tabTooltips?.get(currentTab))
                  ? h(
                      InfoBox,
                      {
                        style: { marginLeft: '1ch' },
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
      div({ style: { display: 'flex', flexGrow: 0, alignItems: 'center' } }),
    ]
  );
}
