import { div, h } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 500,
    textTransform: 'uppercase',
    marginTop: '1rem',
    height: '3.75rem',
  },
  button: (isActive: boolean) => ({
    ...Style.tabBar.tab,
    ...(isActive ? Style.tabBar.active : {}),
    backgroundColor: undefined,
    fontSize: 14,
  }),
};

type TabProps = {
  key: string;
  title: string;
  isValid: boolean;
  activeTabKey: string;
  onChangeTab: (arg0: string) => void;
};

const Tab = ({ key, title, isValid, activeTabKey, onChangeTab }: TabProps) =>
  h(
    Clickable,
    {
      style: styles.button(key === activeTabKey),
      onClick: () => onChangeTab(key),
    },
    [
      div(
        {
          style: {
            marginBottom: key === activeTabKey ? -Style.tabBar.active.borderBottomWidth : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          },
        },
        [
          div({ style: { textAlign: 'center' } }, [
            title,
            div({ style: { fontWeight: styles.button(true).fontWeight, height: 0, visibility: 'hidden' } }, [title]), // so the width of the text container doesn't change with boldness
          ]),
          !isValid && icon('error-standard', { size: 14, style: { marginLeft: '1rem', color: colors.warning() } }),
        ]
      ),
    ]
  );

export default Tab;
