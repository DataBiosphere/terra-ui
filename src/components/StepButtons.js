import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { Component } from 'src/libs/wrapped-components'


const buttonWidth = 185
const buttonHeight = 50
const dotSpace = 7
const dotSize = 6


const styles = {
  container: {
    display: 'flex', alignItems: 'flex-start',
    margin: '2rem 0'
  },
  button: isActive => ({
    display: 'flex', alignItems: 'center',
    flex: 'none',
    width: buttonWidth, height: buttonHeight,
    borderRadius: buttonHeight/2, borderWidth: 2, borderStyle: 'solid',
    borderColor: isActive ? colors.blue[0] : colors.gray[3],
    backgroundColor: isActive ? colors.blue[1] : colors.gray[4],
    color: 'white',
    padding: '0 1.5rem'
  }),
  buttonLabel: {
    textTransform: 'uppercase', fontWeight: 600, fontSize: 16, marginLeft: '0.5rem'
  }
}

const els = {
  dot: isActive => div({
    style: {
      width: dotSize, height: dotSize, borderRadius: '100%',
      margin: `${(buttonHeight-dotSize)/2}px ${dotSpace}px 0 0`,
      backgroundColor: isActive ? colors.green[0] : colors.gray[3]
    }
  }),
  selectionUnderline: div({
    style: {
      margin: '8px auto 0', width: buttonWidth - buttonHeight,
      border: `4px solid ${colors.blue[0]}`, borderRadius: 4
    }
  })
}


const stepButton = ({ i, key, title, selectedIndex, onChangeTab }) => {
  const isActive = i <= selectedIndex

  const button = h(Clickable, {
    key,
    style: styles.button(isActive),
    onClick: () => onChangeTab(key)
  }, [
    i < selectedIndex ?
      // ugh, why are these so different visually?
      icon('check-circle', { className: 'is-solid', size: 24 }) :
      icon('edit', { className: 'is-solid', size: 16, style: { margin: 4 } }),
    span({ style: styles.buttonLabel }, [title])
  ])

  return h(Fragment, [
    i > 0 && h(Fragment, [els.dot(isActive), els.dot(isActive)]),
    div({ style: { marginRight: dotSpace } }, [
      button,
      i === selectedIndex && els.selectionUnderline
    ])
  ])
}


class StepButtons extends Component {
  constructor(props) {
    super(props)

    this.tabMap = _.flow(
      _.toPairs,
      _.map(([i, { key }]) => ({ [key]: i * 1 })),
      _.mergeAll
    )(props.tabs)
  }

  render() {
    const { tabs, activeTab, onChangeTab } = this.props
    const selectedIndex = this.tabMap[activeTab]

    return div({ style: styles.container }, [
      ..._.map(([i, { key, title }]) => stepButton({ i: i * 1, key, title, selectedIndex, onChangeTab }), _.toPairs(tabs))
    ])
  }
}

export default StepButtons
