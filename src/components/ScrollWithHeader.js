import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import Interactive from 'react-interactive'


export const emptyHeader = style => div({
  style: _.merge({ color: 'transparent', userSelect: 'none' }, style)
}, ['.'])


export class ScrollWithHeader extends Component {
  render() {
    const { selectedTabIndex, header, children, negativeMargin, contentBackground } = this.props

    return h(Fragment, [
      div({
        style: {
          display: 'flex',
          border: `1px solid ${Style.colors.sectionBorder}`,
          borderBottom: 'unset',
          backgroundColor: Style.colors.sectionHighlight,
          borderTopRightRadius: 5,
          borderTopLeftRadius: selectedTabIndex !== 0 && 5
        }
      }, [
        div({ style: { padding: '0.5rem' } }, [
          header
        ])
      ]),
      div({
        style: {
          margin: negativeMargin && `0 -${negativeMargin}`,
          borderTop: `2px solid ${Style.colors.secondary}`,
          padding: negativeMargin && `0 ${negativeMargin}`,
          backgroundColor: contentBackground
        }
      }, children)
    ])
  }
}


export class TabbedScrollWithHeader extends Component {
  constructor(props) {
    super(props)

    this.controlled = props.selectedTabIndex !== undefined
    if (!this.controlled) {
      this.state = { selectedTabIndex: 0 }
    }
  }

  render() {
    const { tabs, tabBarExtras, setSelectedTabIndex, ...childProps } = this.props
    const selectedTabIndex = (this.controlled ? this.props : this.state).selectedTabIndex

    return h(Fragment, [
      div(
        { style: { display: 'flex', alignItems: 'baseline' } },
        _.concat(
          tabs.map(({ title }, index) => {
            const selected = index === selectedTabIndex
            const border = `1px solid ${selected ? Style.colors.sectionBorder : 'transparent'}`
            return h(Interactive, {
              as: 'div',
              style: {
                display: 'inline-flex', alignItems: 'center', lineHeight: 2,
                position: 'relative', padding: '0.7rem 1.5rem',
                fontSize: 16, fontWeight: 500, color: Style.colors.secondary,
                backgroundColor: selected && Style.colors.sectionHighlight,
                borderTop: border, borderLeft: border, borderRight: border,
                borderRadius: '5px 5px 0 0'
              },
              onClick: () => {
                if (this.controlled) {
                  setSelectedTabIndex(index)
                } else {
                  this.setState({ selectedTabIndex: index })
                }
              }
            }, [
              title,
              selected && div({
                style: {
                  // Fractional L/R to make border corners line up when zooming in. Works for up to 175% in Chrome.
                  position: 'absolute', left: 0.4, right: 0.1, bottom: -3, height: 5,
                  backgroundColor: Style.colors.sectionHighlight
                }
              })
            ])
          }),
          tabBarExtras
        )
      ),
      h(ScrollWithHeader, {
        ...childProps,
        selectedTabIndex,
        header: tabs[selectedTabIndex].header,
        children: tabs[selectedTabIndex].children
      })
    ])
  }
}
