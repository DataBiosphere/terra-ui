import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { buttonPrimary, LabeledCheckbox, link, RadioButton, spinnerOverlay } from 'src/components/common'
import { centeredSpinner, profilePic } from 'src/components/icons'
import { textInput, validatedInput } from 'src/components/input'
import { InfoBox } from 'src/components/PopupTrigger'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import { authStore, getUser, refreshTerraProfile } from 'src/libs/auth'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const styles = {
  page: {
    margin: '0 5rem 2rem',
    width: 700
  },
  sectionTitle: {
    margin: '2rem 0 1rem',
    color: colors.darkBlue[0], fontSize: 16, fontWeight: 600, textTransform: 'uppercase'
  },
  header: {
    line: {
      margin: '1rem 0',
      display: 'flex', alignItems: 'center'
    },

    nameLine: {
      marginLeft: '1rem',
      color: colors.darkBlue[0],
      fontSize: '150%'
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


const sectionTitle = text => div({ style: styles.sectionTitle }, [text])

const Profile = _.flow(
  ajaxCaller,
  Utils.connectAtom(authStore, 'authState')
)(class Profile extends Component {
  constructor(props) {
    super(props)

    this.state = { profileInfo: _.mapValues(v => v === 'N/A' ? '' : v, props.authState.profile) }
  }

  render() {
    const { profileInfo, saving } = this.state
    const { firstName } = profileInfo

    return h(Fragment, [
      saving && spinnerOverlay,
      h(TopBar),
      !profileInfo ? centeredSpinner() :
        div({ style: styles.page }, [
          sectionTitle('Profile'),
          div({ style: styles.header.line }, [
            div({ style: { position: 'relative' } }, [
              profilePic({ size: 48 }),
              h(InfoBox, { style: { alignSelf: 'flex-end', padding: '0.25rem' } }, [
                'To change your profile image, visit your ',
                link({
                  href: `https://myaccount.google.com?authuser=${getUser().email}`,
                  target: '_blank'
                }, ['Google account page.'])
              ])
            ]),
            div({ style: styles.header.nameLine }, [
              `Hello again, ${firstName}`
            ])
          ]),
          this.renderForm()
        ])
    ])
  }

  renderForm() {
    const { profileInfo, proxyGroup } = this.state

    const { firstName, lastName } = profileInfo
    const required = { presence: { allowEmpty: false } }
    const errors = validate({ firstName, lastName }, { firstName: required, lastName: required })

    const line = (...children) => div({ style: styles.form.line }, children)

    const textField = (key, title, { placeholder, required } = {}) => div({ style: styles.form.container }, [
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

    const radioButton = (key, value) => h(RadioButton, {
      text: value, checked: profileInfo[key] === value,
      labelStyle: { margin: '0 2rem 0 0.25rem' },
      onChange: () => this.assignValue(key, value)
    })

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

      div({ style: styles.form.title }, [
        'Proxy Group',
        h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
          'For more information about proxy groups, see the ',
          link({
            href: 'https://software.broadinstitute.org/firecloud/documentation/article?id=11185',
            target: '_blank'
          }, ['user guide.'])
        ])
      ]),
      div({ style: { margin: '1rem' } }, [proxyGroup]),

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
        disabled: !!errors,
        tooltip: !!errors && 'Please fill out all required fields'
      }, ['Save Profile'])
    ])
  }

  assignValue(key, value) {
    this.setState({ profileInfo: _.set(key, value, this.state.profileInfo) })
  }

  async save() {
    const { profileInfo } = this.state
    const { ajax: { User } } = this.props

    this.setState({ saving: true })
    await User.profile.set(_.pickBy(_.identity, profileInfo))
    await refreshTerraProfile()
    this.setState({ saving: false })
  }

  async componentDidMount() {
    const { ajax: { User }, authState: { profile: { email } } } = this.props

    this.setState({ proxyGroup: await User.getProxyGroup(email) })
  }
})


export const addNavPaths = () => {
  Nav.defPath('profile', {
    path: '/profile',
    component: Profile,
    title: 'Profile'
  })
}
