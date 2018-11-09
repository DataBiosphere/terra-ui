import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { TextArea, validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { InfoBox } from 'src/components/PopupTrigger'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Forms from 'src/libs/forms'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const authDoc = 'https://software.broadinstitute.org/firecloud/documentation/article?id=9524'
const billingDoc = 'https://gatkforums.broadinstitute.org/firecloud/discussion/9763/howto-create-a-new-firecloud-billing-project'
const billingMail = 'saturn-dev@broadinstitute.org'

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

export default ajaxCaller(class NewWorkspaceModal extends Component {
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
      busy: false,
      createError: undefined
    }
  }

  async componentDidMount() {
    const { ajax: { Billing, Groups } } = this.props
    try {
      const [billingProjects, allGroups] = await Promise.all([
        Billing.listProjects(),
        Groups.list()
      ])
      this.setState({ billingProjects, allGroups })
    } catch (error) {
      reportError('Error loading data', error)
    }
  }

  async create() {
    const { onSuccess, cloneWorkspace, ajax: { Workspaces } } = this.props
    const { namespace, name, description, groups } = this.state
    try {
      this.setState({ createError: undefined, busy: true })
      const body = {
        namespace,
        name,
        authorizationDomain: _.map(v => ({ membersGroupName: v }), [...this.getRequiredGroups(), ...groups]),
        attributes: { description }
      }
      const workspace = await (cloneWorkspace ?
        Workspaces.workspace(cloneWorkspace.workspace.namespace, cloneWorkspace.workspace.name).clone(body) :
        Workspaces.create(body))
      onSuccess(workspace)
    } catch (error) {
      this.setState({ createError: JSON.parse(error).message, busy: false })
    }
  }

  getRequiredGroups() {
    const { cloneWorkspace, requiredAuthDomain } = this.props
    return _.uniq([
      ...(cloneWorkspace ? _.map('membersGroupName', cloneWorkspace.workspace.authorizationDomain) : []),
      ...(requiredAuthDomain ? [requiredAuthDomain] : [])
    ])
  }

  render() {
    const { onDismiss, cloneWorkspace } = this.props
    const { namespace, name, billingProjects, allGroups, groups, description, nameModified, busy, createError } = this.state
    const existingGroups = this.getRequiredGroups()
    const errors = validate({ namespace, name }, constraints, {
      prettify: v => ({ namespace: 'Billing project', name: 'Name' }[v] || validate.prettify(v))
    })
    return h(Modal, {
      title: cloneWorkspace ? 'Clone a Workspace' : 'Create a New Workspace',
      onDismiss,
      okButton: buttonPrimary({
        disabled: errors,
        tooltip: Utils.summarizeErrors(errors),
        onClick: () => this.create(),
        dataTestId: 'createWorkspaceButton'
      }, cloneWorkspace ? 'Clone Workspace' : 'Create Workspace')
    }, [
      Forms.requiredFormLabel('Workspace name'),
      validatedInput({
        inputProps: {
          autoFocus: true,
          placeholder: 'Enter a name',
          value: name,
          onChange: e => this.setState({ name: e.target.value, nameModified: true }),
          dataTestId: 'workspaceNameInput'
        },
        error: Utils.summarizeErrors(nameModified && errors && errors.name)
      }),
      Forms.requiredFormLabel('Billing project'),
      billingProjects && !billingProjects.length ? h(Fragment, [
        div({ style: { color: colors.red[0] } }, [
          icon('error', { size: 16 }),
          ' You must have a billing project associated with your account to create a new workspace.'
        ]),
        div({ style: { marginTop: '1rem' } }, [
          'Billing projects are currently managed through FireCloud. ',
          link({ target: '_blank', href: billingDoc }, [
            'Learn how to create a billing project using FireCloud. '
          ]),
          'Or, email ', link({ href: `mailto:${billingMail}` }, [billingMail]), ' with questions.'
        ])
      ]) : h(Select, {
        isClearable: false,
        placeholder: 'Select a billing project',
        value: namespace,
        onChange: ({ value }) => this.setState({ namespace: value, dataTestId: value }),
        options: _.uniq(_.map('projectName', billingProjects)).sort()
      }),
      Forms.formLabel('Description'),
      h(TextArea, {
        style: { height: 100 },
        placeholder: 'Enter a description',
        value: description,
        onChange: e => this.setState({ description: e.target.value })
      }),
      Forms.formLabel('Authorization domain', h(InfoBox, [
        'An authorization domain can only be set when creating a workspace. ',
        'Once set, it cannot be changed. ',
        'Any cloned workspace will automatically inherit the authorization domain(s) from the original workspace and cannot be removed. ',
        link({ href: authDoc, target: '_blank' }, ['Read more about authorization domains'])
      ])),
      !!existingGroups.length && div({ style: styles.groupNotice }, [
        div({ style: { marginBottom: '0.2rem' } }, ['Inherited groups:']),
        ...existingGroups.join(', ')
      ]),
      h(Select, {
        isClearable: false,
        isMulti: true,
        placeholder: 'Select groups',
        value: groups,
        onChange: data => this.setState({ groups: _.map('value', data) }),
        options: _.difference(_.map('groupName', allGroups), existingGroups).sort()
      }),
      createError && div({
        style: { marginTop: '1rem', color: colors.red[0] }
      }, [createError]),
      busy && spinnerOverlay
    ])
  }
})
