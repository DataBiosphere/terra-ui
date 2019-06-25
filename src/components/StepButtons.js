import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'


const styles = {
  container: {
    display: 'flex', alignItems: 'center',
    fontWeight: 500, textTransform: 'uppercase',
    marginTop: '1rem', height: '3.75rem'
  },
  button: isActive => ({
    ...Style.tabBar.tab,
    ...(isActive ? Style.tabBar.active : {}),
    backgroundColor: undefined,
    fontSize: '1rem'
  }),
  dot: {
    width: 6, height: 6, borderRadius: '100%',
    margin: '0 2px',
    backgroundColor: colors.dark(0.4)
  }
}

const dots = div({ style: { display: 'flex', margin: '0 0.5rem' } }, [
  div({ style: styles.dot }), div({ style: styles.dot })
])

const stepButton = ({ key, title, isValid, activeTabKey, onChangeTab }) => h(Interactive, {
  as: 'a',
  style: styles.button(key === activeTabKey),
  onClick: () => onChangeTab(key)
}, [
  div({ style: { marginBottom: key === activeTabKey ? -(Style.tabBar.active.borderBottomWidth) : undefined } }, [
    title,
    !isValid && icon('error-standard', { size: 14, style: { marginLeft: '1rem', color: colors.warning() } })
  ])
])

const StepButtons = ({ tabs, activeTab: activeTabKey, onChangeTab, finalStep }) => div({ style: styles.container }, [
  ..._.map(
    ({ key, title, isValid }) => h(Fragment, [
      stepButton({ key, title, isValid, activeTabKey, onChangeTab }),
      dots
    ]),
    tabs
  ),
  finalStep
])

export default StepButtons
