import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { TextArea, ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { InfoBox } from 'src/components/PopupTrigger'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import { FormLabel, RequiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { authStore, freeCreditsActive } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const constraints = {
  name: {
    presence: { allowEmpty: false },
    length: { maximum: 254 },
    format: {
      pattern: /[\w- ]*/,
      message: 'can only contain letters, numbers, dashes, underscores, and spaces'
    }
  },
  namespace: {
    presence: true
  }
}

const styles = {
  groupNotice: {
    marginBottom: '0.5rem',
    fontSize: 12
  }
}

export default _.flow(
  ajaxCaller,
  Utils.connectAtom(authStore, 'authState')
)(class NewWorkspaceModal extends Component {
  static propTypes = {
    cloneWorkspace: PropTypes.object,
    onDismiss: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    const { cloneWorkspace } = props
    this.state = {
      billingProjects: undefined,
      allGroups: undefined,
      name: cloneWorkspace ? `${cloneWorkspace.workspace.name} copy` : '',
      namespace: cloneWorkspace ? cloneWorkspace.workspace.namespace : undefined,
      description: (cloneWorkspace && cloneWorkspace.workspace.attributes.description) || '',
      groups: [],
      nameModified: false,
      loading: false,
      creating: false,
      createError: undefined
    }
  }

  async componentDidMount() {
    this.loadProjectsGroups()
  }

  async create() {
    const { onSuccess, cloneWorkspace } = this.props
    const { namespace, name, description, groups } = this.state
    try {
      this.setState({ createError: undefined, creating: true })
      const body = {
        namespace,
        name,
        authorizationDomain: _.map(v => ({ membersGroupName: v }), [...this.getRequiredGroups(), ...groups]),
        attributes: { description },
        copyFilesWithPrefix: 'notebooks/'
      }
      const workspace = await (cloneWorkspace ?
        Ajax().Workspaces.workspace(cloneWorkspace.workspace.namespace, cloneWorkspace.workspace.name).clone(body) :
        Ajax().Workspaces.create(body))
      onSuccess(workspace)
    } catch (error) {
      const { message } = await error.json()
      this.setState({ createError: message, creating: false })
    }
  }

  getRequiredGroups() {
    const { cloneWorkspace, requiredAuthDomain } = this.props
    return _.uniq([
      ...(cloneWorkspace ? _.map('membersGroupName', cloneWorkspace.workspace.authorizationDomain) : []),
      ...(requiredAuthDomain ? [requiredAuthDomain] : [])
    ])
  }

  loadProjectsGroups = _.flow(
    withErrorReporting('Error loading data'),
    Utils.withBusyState(v => this.setState({ loading: v }))
  )(async () => {
    const { ajax: { Billing, Groups } } = this.props
    const [billingProjects, allGroups] = await Promise.all([
      Billing.listProjects(),
      Groups.list()
    ])
    const usableProjects = _.filter({ creationStatus: 'Ready' }, billingProjects)
    this.setState(({ namespace }) => ({
      billingProjects: usableProjects, allGroups,
      namespace: _.some({ projectName: namespace }, usableProjects) ? namespace : undefined
    }))
  })

  render() {
    const { onDismiss, cloneWorkspace, authState: { profile } } = this.props
    const { trialState } = profile
    const { namespace, name, billingProjects, allGroups, groups, description, nameModified, loading, createError, creating } = this.state
    const existingGroups = this.getRequiredGroups()
    const hasBillingProjects = !!billingProjects && !!billingProjects.length
    const hasFreeCredits = trialState === 'Enabled'
    const errors = validate({ namespace, name }, constraints, {
      prettify: v => ({ namespace: 'Billing project', name: 'Name' }[v] || validate.prettify(v))
    })

    return Utils.cond(
      [loading, spinnerOverlay],
      [hasBillingProjects, () => h(Modal, {
        title: cloneWorkspace ? 'Clone a Workspace' : 'Create a New Workspace',
        onDismiss,
        okButton: buttonPrimary({
          disabled: errors,
          tooltip: Utils.summarizeErrors(errors),
          onClick: () => this.create()
        }, cloneWorkspace ? 'Clone Workspace' : 'Create Workspace')
      }, [
        h(RequiredFormLabel, ['Workspace name']),
        h(ValidatedInput, {
          inputProps: {
            autoFocus: true,
            placeholder: 'Enter a name',
            value: name,
            onChange: v => this.setState({ name: v, nameModified: true })
          },
          error: Utils.summarizeErrors(nameModified && errors && errors.name)
        }),
        h(RequiredFormLabel, ['Billing project']),
        h(Select, {
          isClearable: false,
          placeholder: 'Select a billing project',
          value: namespace,
          onChange: ({ value }) => this.setState({ namespace: value }),
          options: _.uniq(_.map('projectName', billingProjects)).sort()
        }),
        h(FormLabel, ['Description']),
        h(TextArea, {
          style: { height: 100 },
          placeholder: 'Enter a description',
          value: description,
          onChange: v => this.setState({ description: v })
        }),
        h(FormLabel, [
          'Authorization domain',
          h(InfoBox, [
            'An authorization domain can only be set when creating a workspace. ',
            'Once set, it cannot be changed. ',
            'Any cloned workspace will automatically inherit the authorization domain(s) from the original workspace and cannot be removed. ',
            link({
              href: 'https://support.terra.bio/hc/en-us/articles/360026775691',
              ...Utils.newTabLinkProps
            }, ['Read more about authorization domains'])
          ])
        ]),
        !!existingGroups.length && div({ style: styles.groupNotice }, [
          div({ style: { marginBottom: '0.2rem' } }, ['Inherited groups:']),
          ...existingGroups.join(', ')
        ]),
        h(Select, {
          isClearable: false,
          isMulti: true,
          placeholder: 'Select groups',
          disabled: !allGroups || !billingProjects,
          value: groups,
          onChange: data => this.setState({ groups: _.map('value', data) }),
          options: _.difference(_.uniq(_.map('groupName', allGroups)), existingGroups).sort()
        }),
        createError && div({
          style: { marginTop: '1rem', color: colors.danger() }
        }, [createError]),
        creating && spinnerOverlay
      ])],
      [hasFreeCredits, () => h(Modal, {
        title: 'Set up Billing',
        onDismiss,
        showCancel: false,
        okButton: buttonPrimary({
          onClick: () => {
            onDismiss()
            freeCreditsActive.set(true)
          }
        }, 'Get Free Credits')
      }, [
        div({ style: { color: colors.warning() } }, [
          icon('error-standard', { size: 16, style: { marginRight: '0.5rem' } }),
          'You need a billing project to ', cloneWorkspace ? 'clone a' : 'create a new', ' workspace.'
        ]),
        div({ style: { marginTop: '0.5rem', fontWeight: 500, marginBottom: '0.5rem' } }, [
          'You have $300 in ',
          link({
            href: 'https://support.terra.bio/hc/en-us/articles/360027940952',
            ...Utils.newTabLinkProps
          }, 'free credits'), ' available!'
        ])
      ])],
      () => h(Modal, {
        title: 'Set up Billing',
        onDismiss,
        showCancel: false,
        okButton: buttonPrimary({
          onClick: () => Nav.goToPath('billing')
        }, 'Go to Billing')
      }, [
        div({ style: { color: colors.warning() } }, [
          icon('error-standard', { size: 16, style: { marginRight: '0.5rem' } }),
          'You need a billing project to ', cloneWorkspace ? 'clone a' : 'create a new', ' workspace.'
        ])
      ])
    )
  }
})
