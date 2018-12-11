import _ from 'lodash/fp'
import { Component } from 'react'
import { div, h, input } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import { authStore } from 'src/libs/auth'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


export const responseRequested = Utils.atom(false)

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

    setTimeout(() => responseRequested.set(true), 1000)
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

    return requestable && div({
      style: {
        position: 'absolute', bottom: '2rem', right: expanded ? '1rem' : 0,
        transition: 'right 0.5s linear'
      }
    }, [
      div({ style: { overflow: 'hidden' } }, [
        h(Clickable, {
          onClick: () => this.setState({ expanded: true }),
          disabled: expanded,
          style: {
            height: expanded ? 300 : 50,
            width: expanded ? 250 : 175,
            padding: '1rem',
            backgroundColor: colors.darkBlue[0], color: 'white',
            borderRadius: expanded ? '0.5rem' : '0.5rem 0 0 0.5rem',
            transition: 'all 0.5s linear',
            transform: `translate(${shouldShow ? '0%' : '100%'})`
          }
        },
        !expanded ?
          'How are we doing?' :
          [
            div('How likely are you to recommend Terra?'),
            '0', input({ type: 'range', min: 0, max: 10 }), '10'
          ]
        ),
        h(Clickable, {
          as: icon('times-circle'),
          onClick: goAway,
          style: {
            width: shouldShow ? 20 : 0,
            height: shouldShow ? 20 : 0,
            position: 'absolute', top: -5, left: -5,
            transition: 'all 0s 0.6s',
            backgroundColor: 'black',
            color: 'white',
            borderRadius: '1rem'
          }
        })
      ])
    ])
  }
})
