import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'


export const params = {
  buttonWidth: 170,
  buttonHeight: 50,
  dotSpace: 7,
  dotSize: 6,
  fontSize: 16
}


const styles = {
  container: {
    display: 'flex', alignItems: 'flex-start',
    marginBottom: '2rem', marginTop: '1rem'
  },
  button: isActive => ({
    display: 'flex', alignItems: 'center',
    flex: 'none',
    width: params.buttonWidth, height: params.buttonHeight,
    borderRadius: params.buttonHeight / 2, borderWidth: 2, borderStyle: 'solid',
    borderColor: isActive ? colors.green[0] : colors.gray[3],
    backgroundColor: isActive ? colors.green[1] : colors.gray[4],
    color: 'white',
    padding: '0 0.5rem 0 1.5rem'
  }),
  buttonLabel: {
    textTransform: 'uppercase', fontWeight: 500, fontSize: params.fontSize, marginLeft: '0.5rem'
  }
}

const els = {
  dot: isActive => div({
    style: {
      width: params.dotSize, height: params.dotSize, borderRadius: '100%',
      margin: `${(params.buttonHeight - params.dotSize) / 2}px ${params.dotSpace}px 0 0`,
      backgroundColor: isActive ? colors.green[0] : colors.gray[3]
    }
  }),
  selectionUnderline: div({
    style: {
      margin: '8px auto 0', width: params.buttonWidth - params.buttonHeight,
      border: `4px solid ${colors.green[0]}`, borderRadius: 4
    }
  })
}


const stepButton = ({ i, key, title, isValid, selectedIndex, onChangeTab, tabs }) => {
  const greenLight = _.every('isValid', _.take(i, tabs))

  const button = h(Clickable, {
    key,
    style: styles.button(isValid),
    onClick: () => onChangeTab(key)
  }, [
    isValid ?
      // ugh, why are these so different visually?
      icon('check-circle', { className: 'is-solid', size: 24 }) :
      icon('edit', { className: 'is-solid', size: 16, style: { margin: 4 } }),
    span({ style: styles.buttonLabel }, [title])
  ])

  return h(Fragment, [
    i > 0 && h(Fragment, [els.dot(greenLight), els.dot(greenLight)]),
    div({ style: { marginRight: params.dotSpace } }, [
      button,
      i === selectedIndex && els.selectionUnderline
    ])
  ])
}


const StepButtons = ({ tabs, activeTab, onChangeTab, finalStep }) => {
  const selectedIndex = _.findIndex({ key: activeTab }, tabs)

  return div({ style: styles.container }, [
    ..._.map(
      ([i, { key, title, isValid }]) => stepButton({ i: i * 1, key, title, isValid, selectedIndex, onChangeTab, tabs }),
      _.toPairs(tabs)
    ),
    finalStep && h(Fragment, [
      els.dot(true), els.dot(true),
      finalStep
    ])
  ])
}

export default StepButtons
