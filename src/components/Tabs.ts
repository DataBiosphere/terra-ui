import { Fragment } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

import Tab from './Tab';

type TabObject = {
  key: string;
  title: string;
  isValid: boolean;
  activeTabKey: string;
  onChangeTab: (arg0: string) => void;
  isLast: boolean;
};

const styles = {
  button: (isActive: boolean) => ({
    ...Style.tabBar.tab,
    ...(isActive ? Style.tabBar.active : {}),
    backgroundColor: undefined,
    fontSize: 14,
  }),
  dot: {
    width: 6,
    height: 6,
    borderRadius: '100%',
    margin: '0 2px',
    backgroundColor: colors.dark(0.4),
  },
};

const dots = div({ style: { display: 'flex', margin: '0 0.5rem' } }, [
  div({ style: styles.dot }),
  div({ style: styles.dot }),
]);

type TabsProps = {
  tabs: TabObject[];
  activeTab: string;
  onChangeTab: (arg0: string) => void;
};

const Tabs = ({ tabs, activeTab: activeTabKey, onChangeTab }: TabsProps) =>
  div(
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        fontWeight: 500,
        textTransform: 'uppercase',
        marginTop: '1rem',
        height: '3.75rem',
      },
    },
    [
      tabs.map(({ key, title, isValid, isLast }) => {
        if (isLast === true) {
          return h(Fragment, { key }, [Tab({ key, title, isValid, activeTabKey, onChangeTab })]);
        }
        return h(Fragment, { key }, [Tab({ key, title, isValid, activeTabKey, onChangeTab }), dots]);
      }),
    ]
  );

export default Tabs;
