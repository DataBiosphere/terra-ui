import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { buttonPrimary, LabeledCheckbox, link, RadioButton, spinnerOverlay } from 'src/components/common'
import { centeredSpinner, icon, profilePic, spinner } from 'src/components/icons'
import { textInput, validatedInput } from 'src/components/input'
import { InfoBox } from 'src/components/PopupTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax, ajaxCaller, useCancellation } from 'src/libs/ajax'
import { authStore, getUser, refreshTerraProfile } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const styles = {
  page: {
    margin: '0 2rem 2rem',
    width: 700
  },
  sectionTitle: {
    margin: '2rem 0 1rem',
    color: colors.darkBlue[0], fontSize: 16, fontWeight: 600, textTransform: 'uppercase'
  },
  header: {
    line: {
      margin: '0 2rem',
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


export const renderShibbolethLink = label => {
  const nihRedirectUrl = `${window.location.origin}/${Nav.getLink('profile')}?nih-username-token={token}`

  return link({
    href: `${getConfig().shibbolethUrlRoot}/link-nih-account?${qs.stringify({ 'redirect-url': nihRedirectUrl })}`,
    style: { display: 'inline-flex', alignItems: 'center' },
    target: '_blank'
  }, [
    label,
    icon('pop-out', { size: 12, style: { marginLeft: '0.2rem' } })
  ])
}


const NihLink = ({ nihToken }) => {
  /*
   * Hooks
   */
  const { nihStatus } = Utils.useAtom(authStore)
  const [linking, setLinking] = useState(false)
  const signal = useCancellation()

  Utils.useOnMount(() => {
    const { User } = Ajax(signal)

    const linkNihAccount = _.flow(
      withErrorReporting('Error linking NIH account'),
      Utils.withBusyState(setLinking)
    )(async () => {
      const nihStatus = await User.linkNihAccount(nihToken)
      authStore.update(state => ({ ...state, nihStatus }))
    })

    if (nihToken) {
      // Clear the query string, but use replace so the back button doesn't take the user back to the token
      Nav.history.replace({ search: '' })
      linkNihAccount()
    }
  })


  /*
   * Render helpers
   */
  const renderDatasetAuthStatus = ({ name, authorized }) => {
    return div({ key: `nih-auth-status-${name}`, style: { display: 'flex' } }, [
      div({ style: { flex: 1 } }, [`${name} Authorization`]),
      div({ style: { flex: 2 } }, [
        authorized ? 'Authorized' : 'Not Authorized',
        !authorized && h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
          'Your account was linked, but you are not authorized to view this controlled dataset. Please go ',
          link({
            href: 'https://dbgap.ncbi.nlm.nih.gov/aa/wga.cgi?page=login',
            target: '_blank'
          }, [
            'here',
            icon('pop-out', { size: 12 })
          ]),
          ' to check your credentials.'
        ])
      ])
    ])
  }

  const renderStatus = () => {
    const { linkedNihUsername, linkExpireTime, datasetPermissions } = nihStatus
    return h(Fragment, [
      !linkedNihUsername && renderShibbolethLink('Log in to NIH to link your account'),
      !!linkedNihUsername && div({ style: { display: 'flex', flexDirection: 'column', width: '33rem' } }, [
        div({ style: { display: 'flex' } }, [
          div({ style: { flex: 1 } }, ['Username:']),
          div({ style: { flex: 2 } }, [linkedNihUsername])
        ]),
        div({ style: { display: 'flex' } }, [
          div({ style: { flex: 1 } }, ['Link Expiration:']),
          div({ style: { flex: 2 } }, [
            div([Utils.makeCompleteDate(linkExpireTime * 1000)]),
            div([renderShibbolethLink('Log in to NIH to re-link your account')])
          ])
        ]),
        _.flow(
          _.sortBy('name'),
          _.map(renderDatasetAuthStatus)
        )(datasetPermissions)
      ])
    ])
  }

  const loading = !nihStatus

  /*
   * Render
   */
  return div({ style: { marginBottom: '1rem' } }, [
    div({ style: styles.form.title }, [
      'NIH Account',
      h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
        'Linking with eRA Commons will allow Terra to automatically determine if you can access controlled datasets hosted in Terra (ex. TCGA) based on your valid dbGaP applications.'
      ])
    ]),
    loading && div([spinner(), 'Loading NIH account status...']),
    linking && div([spinner(), 'Linking NIH account...']),
    !loading && !linking && renderStatus()
  ])
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
    const { queryParams = {} } = this.props
    const { profileInfo, saving } = this.state
    const { firstName } = profileInfo

    return h(Fragment, [
      saving && spinnerOverlay,
      h(TopBar),
      !profileInfo ? centeredSpinner() : h(Fragment, [
        div({ style: { marginLeft: '2rem' } }, [sectionTitle('Profile')]),
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
        div({ style: { display: 'flex' } }, [
          div({ style: styles.page }, [
            this.renderForm()
          ]),
          div({ style: { marginTop: '0' } }, [
            sectionTitle('Identity & External Servers'),
            h(NihLink, { nihToken: queryParams['nih-username-token'] })
          ])
        ])
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
