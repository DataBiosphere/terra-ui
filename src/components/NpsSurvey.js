import _ from 'lodash/fp'
import { Component } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import { authStore } from 'src/libs/auth'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


export const responseRequested = Utils.atom(true)

export const NpsSurvey = _.flow(
  Utils.connectAtom(responseRequested, 'responseRequested'),
  Utils.connectAtom(authStore, 'authState')
)(class NpsSurvey extends Component {
  constructor(props) {
    super(props)

    this.state = { requestable: false, expanded: false }
  }

  componentDidMount() {
    const { authState: { isSignedIn } } = this.props

    if (isSignedIn) {
      this.loadStatus()
    }
  }

  componentDidUpdate(prevProps) {
    const { authState: { isSignedIn } } = this.props

    if (isSignedIn && !prevProps.authState.isSignedIn) {
      this.loadStatus()
    }
  }

  async loadStatus() {
    const lastResponse = (await Ajax().User.lastNpsResponse()).timestamp
    const oneMonthAgo = _.tap(d => d.setDate(d.getMonth() - 1), new Date())

    this.setState({ requestable: !lastResponse || (new Date(lastResponse) < oneMonthAgo) })
  }

  render() {
    const { responseRequested } = this.props
    const { requestable, expanded } = this.state
    const shouldShow = responseRequested && requestable
    const goAway = () => {
      this.setState({ requestable: false })
      // Ajax().User.postNpsResponse({})
    }

    return div({
      style: {
        position: 'absolute', bottom: '2rem', right: expanded ? '1rem' : 0,
        transition: 'right 0.5s linear'
      }
    }, [
      div({ style: { overflow: 'hidden' } }, [
        h(Clickable, {
          onClick: expanded ? undefined : () => this.setState({ expanded: true }),
          disabled: expanded,
          style: {
            padding: '1rem',
            backgroundColor: colors.darkBlue[0], color: 'white',
            borderRadius: expanded ? '0.5rem' : '0.5rem 0 0 0.5rem',
            transition: 'transform 0.5s linear',
            transform: `translate(${shouldShow ? '0%' : '100%'})`
          }
        }, [
          'How are we doing?'
        ]),
        h(Clickable, {
          as: icon('times-circle'),
          onClick: goAway,
          style: {
            width: shouldShow ? 20 : 0,
            height: shouldShow ? 20 : 0,
            position: 'absolute', top: -5, left: -5,
            transition: shouldShow ? undefined : 'all 0.5s 1s',
            backgroundColor: 'black',
            color: 'white',
            borderRadius: '1rem'
          }
        })
      ])
    ])
  }
})
