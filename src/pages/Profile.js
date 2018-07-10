import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, input, label, path, span, svg } from 'react-hyperscript-helpers'
import { buttonPrimary, LabeledCheckbox, spinnerOverlay } from 'src/components/common'
import { centeredSpinner, profilePic } from 'src/components/icons'
import { textInput, validatedInput } from 'src/components/input'
import { TopBar } from 'src/components/TopBar'
import { Orchestration } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const styles = {
  page: {
    margin: '0 5rem',
    width: 700
  },
  sectionTitle: {
    margin: '2rem 0 1rem',
    color: Style.colors.title, fontSize: 16, fontWeight: 500, textTransform: 'uppercase'
  },
  header: {
    line: {
      margin: '1rem 0',
      display: 'flex', alignItems: 'center'
    },
    pic: {
      borderRadius: '100%'
    },
    text: {
      container: {
        marginLeft: '2rem',
        color: Style.colors.title
      },
      nameLine: {
        fontSize: '150%'
      },
      percentageLine: {
        fontSize: '125%'
      }
    }
  },
  form: {
    line: {
      display: 'flex', justifyContent: 'space-between',
      margin: '2rem 0'
    },
    container: {
      width: 320
    },
    title: {
      whiteSpace: 'nowrap', fontSize: 16,
      marginBottom: '0.3rem'
    },
    checkboxLine: {
      margin: '0.75rem 0'
    },
    checkboxLabel: {
      marginLeft: '0.5rem'
    }
  }
}


const percentageCircle = ({ radius, fraction, color = '#7bb156', strokeWidth = 6, style }) => {
  const halfStroke = strokeWidth/2
  const adjRadius = radius - halfStroke
  const diameter = 2 * radius
  const adjDiameter = 2 * adjRadius
  const circumference = adjDiameter * Math.PI

  const pathDesc =
    `M${radius} ${halfStroke} 
     a ${adjRadius} ${adjRadius} 0 0 1 0 ${adjDiameter} 
     a ${adjRadius} ${adjRadius} 0 0 1 0 -${adjDiameter}`

  return svg({ style: { width: diameter, height: diameter, ...style } }, [
    path({
      d: pathDesc,
      fill: 'none',
      stroke: '#d0d0d0',
      strokeWidth
    }),
    path({
      d: pathDesc,
      fill: 'none',
      stroke: color,
      strokeWidth,
      strokeDasharray: `${fraction * circumference}, ${circumference}`,
      strokeLinecap: 'round'
    })
  ])
}


const sectionTitle = text => div({ style: styles.sectionTitle }, [text])


const profileKeys = [
  'firstName', 'lastName', 'title', 'institute', 'institutionalProgram',
  'nonProfitStatus', 'pi', 'programLocationCity', 'programLocationState', 'programLocationCountry'
]


class Profile extends Component {
  async refresh() {
    this.setState({ profileInfo: undefined, displayName: undefined, fractionCompleted: undefined, saving: false })

    const { keyValuePairs } = await Orchestration.profile.get()
    const profileInfo = _.reduce(
      (accum, { key, value }) => _.assign(accum, { [key]: value === 'N/A' ? '' : value }),
      {},
      keyValuePairs
    )

    const countCompleted = _.flow(
      _.pick(profileKeys),
      _.values,
      _.compact,
      _.size
    )(profileInfo)

    this.setState({
      profileInfo,
      displayName: profileInfo.firstName,
      fractionCompleted: countCompleted / profileKeys.length
    })
  }

  render() {
    const { profileInfo, displayName, fractionCompleted, saving } = this.state
    const isComplete = fractionCompleted === 1.0

    const profilePicRadius = 48
    const strokeRadius = 3
    // Rendering the circle to cover up the edge of the image to avoid aliasing issues

    return h(Fragment, [
      saving && spinnerOverlay,
      h(TopBar),
      !profileInfo ? centeredSpinner() :
        div({ style: styles.page }, [
          sectionTitle('Profile'),
          div({ style: styles.header.line }, [
            div({ style: { position: 'relative', padding: strokeRadius } }, [
              profilePic({ size: 2*profilePicRadius }),
              percentageCircle({
                radius: profilePicRadius+strokeRadius, fraction: fractionCompleted, strokeWidth: 2*strokeRadius,
                style: { position: 'absolute', top: strokeRadius, left: strokeRadius, margin: -strokeRadius }
              })
            ]),
            div({ style: styles.header.text.container }, [
              div({ style: styles.header.text.nameLine }, [`Hello again, ${displayName}`]),
              !isComplete && div({ style: styles.header.text.percentageLine }, [
                `Complete your profile. It's at ${(100*fractionCompleted)|0}%`
              ])
            ])
          ]),
          this.renderForm()
        ])
    ])
  }

  renderForm() {
    const { profileInfo } = this.state

    const { firstName, lastName } = profileInfo
    const required = { presence: { allowEmpty: false } }
    const errors = validate({ firstName, lastName }, { firstName: required, lastName: required })

    const line = (...children) => div({ style: styles.form.line }, children)

    const textField = (key, title, { placeholder, required } = {}) =>
      div({ style: styles.form.container }, [
        div({ style: styles.form.title }, [title]),
        required ?
          validatedInput({
            inputProps: {
              value: profileInfo[key],
              onChange: e => this.assignValue(key, e.target.value),
              placeholder: placeholder || 'Required'
            },
            error: Utils.summarizeErrors(errors && errors[key])
          }) :
          textInput({
            value: profileInfo[key],
            onChange: e => this.assignValue(key, e.target.value),
            placeholder
          })
      ])

    const radioButton = (key, value) => h(Fragment, [
      input({
        type: 'radio', id: value,
        name: value, // not semantically correct, but fixes a focus cycle issue
        checked: profileInfo[key] === value,
        onChange: () => this.assignValue(key, value)
      }),
      label({ htmlFor: value, style: { margin: '0 2rem 0 0.25rem' } }, value)
    ])

    const checkbox = (key, title) => div({ style: styles.form.checkboxLine }, [
      h(LabeledCheckbox, {
        checked: profileInfo[key] === 'true',
        onChange: v => this.assignValue(key, v.toString())
      }, [span({ style: styles.form.checkboxLabel }, [title])])
    ])

    return h(Fragment, [
      line(
        textField('firstName', 'First Name', { required: true }),
        textField('lastName', 'Last Name', { required: true })
      ),
      line(
        textField('title', 'Title')
      ),
      line(
        textField('contactEmail', 'Contact Email for Notifications (if different)', { placeholder: profileInfo.email })
      ),
      line(
        textField('institute', 'Institution'),
        textField('institutionalProgram', 'Institutional Program')
      ),

      sectionTitle('Program Info'),

      div({ style: styles.form.title }, ['Non-Profit Status']),
      div({ style: { margin: '1rem' } }, [
        radioButton('nonProfitStatus', 'Profit'),
        radioButton('nonProfitStatus', 'Non-Profit')
      ]),
      line(
        textField('pi', 'Principal Investigator/Program Lead')
      ),
      line(
        textField('programLocationCity', 'City'),
        textField('programLocationState', 'State')
      ),
      line(
        textField('programLocationCountry', 'Country')
      ),

      sectionTitle('Account Notifications'),

      checkbox('notifications/GroupAccessRequestNotification', 'Group Access Requested'),
      checkbox('notifications/WorkspaceAddedNotification', 'Workspace Access Added'),
      checkbox('notifications/WorkspaceRemovedNotification', 'Workspace Access Removed'),

      buttonPrimary({
        style: { marginTop: '3rem' },
        onClick: () => this.save(),
        disabled: !!errors
      }, ['Save Profile'])
    ])
  }

  assignValue(key, value) {
    this.setState({ profileInfo: _.assign(this.state.profileInfo, { [key]: value }) })
  }

  async save() {
    const { profileInfo } = this.state

    this.setState({ saving: true })
    await Orchestration.profile.set(_.pickBy(_.identity, profileInfo))
    this.refresh()
  }

  componentDidMount() {
    this.refresh()
  }
}


export const addNavPaths = () => {
  Nav.defPath('profile', {
    path: '/profile',
    component: Profile,
    title: 'Profile'
  })
}
