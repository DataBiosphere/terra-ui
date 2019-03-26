import _ from 'lodash/fp'
import { Component } from 'react'
import { div, h, input, span } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { buttonSecondary, Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import { TextArea } from 'src/components/input'
import { Ajax } from 'src/libs/ajax'
import { authStore } from 'src/libs/auth'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  questionLabel: { fontWeight: 600, marginBottom: '0.5rem' },
  questionInput: { marginBottom: '0.75rem', height: '4rem', marginTop: '0.25rem' }
}

export const NpsSurvey = Utils.connectAtom(authStore, 'authState')(class NpsSurvey extends Component {
  constructor(props) {
    super(props)

    this.state = { requestable: false, expanded: false }
  }

  componentDidMount() {
    const { authState: { registrationStatus } } = this.props

    if (registrationStatus === 'registered') {
      this.loadStatus()
    }
  }

  componentDidUpdate(prevProps) {
    const { authState: { registrationStatus } } = this.props

    if (registrationStatus === 'registered' && prevProps.authState.registrationStatus !== 'registered') {
      this.loadStatus()
    }

    if (registrationStatus !== 'registered' && prevProps.authState.registrationStatus === 'registered') {
      this.setState({ requestable: false })
    }
  }

  async loadStatus() {
    const millisToHours = timestamp => Date.parse(timestamp)/(60 * 60 * 1000)

    const currentTimeHours = millisToHours(new Date())
    const lastResponseTimestamp = (await Ajax().User.lastNpsResponse()).timestamp
    const firstTimestamp = async () => (await Ajax().User.firstTimestamp()).timestamp

    // Behavior of the following logic: When a user first accesses Terra, wait 7 days to show the NPS survey.
    // Once user has interacted with the NPS survey, wait 90 days to show the survey.
    const askTheUser = lastResponseTimestamp
      ? currentTimeHours - millisToHours(lastResponseTimestamp) >= (90 * 24)
      : currentTimeHours - millisToHours(await firstTimestamp()) >= (7 * 24)

    this.setState({ requestable: askTheUser })
  }

  render() {
    const { requestable, expanded, score, reasonComment, changeComment } = this.state
    const goAway = shouldSubmit => () => {
      this.setState({ requestable: false })
      Ajax().User.postNpsResponse(shouldSubmit ? { score, reasonComment, changeComment } : {})
    }

    const scoreRadios = _.map(i => {
      const isSelected = i === score
      const bgColor = Utils.cond(
        [i <= 6, colors.brick],
        [i <= 8, colors.orange[0]],
        colors.green[0]
      )

      return h(Interactive, {
        as: 'label',
        style: {
          width: 25, borderRadius: '1rem',
          lineHeight: '25px', textAlign: 'center',
          cursor: 'pointer',
          ...(isSelected ? { backgroundColor: bgColor } : {})
        },
        hover: isSelected ? {} : { backgroundColor: colors.gray[2] }
      }, [
        input({
          type: 'radio', value: i, name: 'nps-score',
          checked: isSelected,
          onChange: () => this.setState({ score: i }),
          style: { display: 'none' }
        }),
        i
      ])
    },
    _.range(0, 11))

    return requestable && div({
      style: {
        position: 'fixed', bottom: '1.5rem', right: expanded ? '1.5rem' : 0,
        transform: `translate(${requestable ? '0%' : 'calc(100% + 5px)'})`,
        transition: 'right 0.2s linear, transform 0.3s linear',
        zIndex: 1
      }
    }, [
      h(Clickable, {
        onClick: () => this.setState({ expanded: true }),
        disabled: expanded,
        style: {
          height: expanded ? 325 : 100,
          width: expanded ? 405 : 255,
          padding: '1rem 1.5rem 1rem 1rem',
          overflow: 'hidden',
          backgroundColor: colors.gray[0], color: 'white',
          borderRadius: expanded ? '0.5rem' : '0.5rem 0 0 0.5rem',
          transition: 'all 0.25s linear',
          boxShadow: Style.standardShadow
        }
      },
      !expanded ? [
        div({ style: styles.questionLabel }, 'How likely are you to recommend Terra to others?'),
        div({ style: { display: 'flex', justifyContent: 'space-around', marginBottom: '0.5rem' } }, scoreRadios)
      ] : [
        div({ style: styles.questionLabel }, 'How likely are you to recommend Terra to others?'),
        div({ style: { display: 'flex', justifyContent: 'space-around', marginBottom: '0.5rem' } }, scoreRadios),
        span({ style: styles.questionLabel }, 'What was the reason for this score? '), span({ style: { ...styles.questionLabel, color: colors.gray[3] } }, '(Optional)'),
        TextArea({ style: styles.questionInput, value: reasonComment, onChange: e => this.setState({ reasonComment: e.target.value }) }),
        span({ style: styles.questionLabel }, 'What could we change? '), span({ style: { ...styles.questionLabel, color: colors.gray[3] } }, '(Optional)'),
        TextArea({ style: styles.questionInput, value: changeComment, onChange: e => this.setState({ changeComment: e.target.value }) }),
        div({ style: { display: 'flex', justifyContent: 'flex-end' } }, [
          buttonSecondary({
            style: { color: 'white' },
            hover: { color: colors.gray[5] },
            onClick: goAway(true)
          }, 'Submit')
        ])
      ]
      ),
      h(Clickable, {
        as: icon('times-circle'),
        onClick: goAway(false),
        size: 20,
        style: {
          position: 'absolute', top: -5, left: -5,
          backgroundColor: 'black',
          color: 'white',
          borderRadius: '1rem'
        }
      })
    ])
  }
})
