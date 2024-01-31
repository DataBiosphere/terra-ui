import _ from 'lodash/fp';
import { Fragment } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

import Tab from './Tab';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 500,
    textTransform: 'uppercase',
    marginTop: '1rem',
    height: '3.75rem',
  },
  button: (isActive) => ({
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

const dots = div({ style: { display: 'flex', margin: '0 0.5rem' } }, [div({ style: styles.dot }), div({ style: styles.dot })]);

const StepButtons = ({ tabs, activeTab: activeTabKey, onChangeTab, finalStep }) =>
  div({ style: styles.container }, [
    ..._.map(({ key, title, isValid }) => h(Fragment, [Tab({ key, title, isValid, activeTabKey, onChangeTab }), dots]), tabs),
    finalStep,
  ]);

export default StepButtons;
