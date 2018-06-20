import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { buttonPrimary, link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { TextArea, validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Style from 'src/libs/style'
import validate from 'validate.js'


const authDoc = 'https://software.broadinstitute.org/firecloud/documentation/article?id=9524'
const billingDoc = 'https://gatkforums.broadinstitute.org/firecloud/discussion/9763/howto-create-a-new-firecloud-billing-project'
const billingMail = 'saturn-dev@broadinstitute.org'

const constraints = {
  name: {
    presence: { allowEmpty: false },
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
  label: {
    ...Style.elements.sectionHeader,
    marginTop: '1rem', marginBottom: '0.25rem'
  }
}

export default class NewWorkspaceModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      billingProjects: undefined,
      allGroups: undefined,
      name: '',
      namespace: undefined,
      description: '',
      groups: [],
      nameModified: false,
      creating: false,
      createError: undefined
    }
  }

  async componentDidMount() {
    try {
      const [billingProjects, allGroups] = await Promise.all([
        Rawls.listBillingProjects(),
        Rawls.listGroups()
      ])
      this.setState({ billingProjects, allGroups })
    } catch (error) {
      reportError('Error loading data', error)
    }
  }

  async create() {
    const { onCreate } = this.props
    const { namespace, name, description, groups } = this.state
    try {
      this.setState({ createError: undefined, creating: true })
      await Rawls.createWorkspace({
        namespace,
        name,
        authorizationDomain: _.map(v => ({ membersGroupName: v }), groups),
        attributes: { description }
      })
      onCreate({ namespace, name })
    } catch (error) {
      this.setState({ createError: JSON.parse(error).message, creating: false })
    }
  }

  render() {
    const { onDismiss } = this.props
    const { namespace, name, billingProjects, allGroups, groups, description, nameModified, creating, createError } = this.state
    const errors = validate({ namespace, name }, constraints, { fullMessages: false })
    return h(Modal, {
      title: 'Create a New Project',
      onDismiss,
      okButton: buttonPrimary({
        disabled: errors,
        onClick: () => this.create()
      }, 'Create project')
    }, [
      div({ style: styles.label }, ['Project name *']),
      validatedInput({
        inputProps: {
          placeholder: 'Enter a name',
          value: name,
          onChange: e => this.setState({ name: e.target.value, nameModified: true })
        },
        name: 'Name',
        errors: nameModified && errors && errors.name
      }),
      div({ style: styles.label }, ['Billing project *']),
      billingProjects && !billingProjects.length ? h(Fragment, [
        div({ style: { color: Style.colors.error } }, [
          icon('error', { size: 16 }),
          ' You must have a billing-project associated with your account to create a new project.'
        ]),
        div({ style: { marginTop: '1rem' } }, [
          'Billing-projects are currently managed through FireCloud. ',
          link({ target: '_blank', href: billingDoc }, [
            'Learn how to create a billing-project using FireCloud. '
          ]),
          'Or, email ', link({ href: `mailto:${billingMail}` }, [billingMail]), ' with questions.'
        ])
      ]) : h(Select, {
        searchable: false,
        clearable: false,
        placeholder: 'Select a billing project',
        value: namespace,
        onChange: ({ value }) => this.setState({ namespace: value }),
        options: _.map(name => {
          return { label: name, value: name }
        }, _.uniq(_.map('projectName', billingProjects)).sort())
      }),
      div({ style: styles.label }, ['Description']),
      h(TextArea, {
        style: { height: 100 },
        placeholder: 'Enter a description',
        value: description,
        onChange: e => this.setState({ description: e.target.value })
      }),
      div({ style: styles.label }, [
        'Authorization domain ',
        h(PopupTrigger, {
          content: div({ style: { padding: '0.5rem', width: 300 } }, [
            'Note: An authorization domain can only be set when creating a project. ',
            'Once set, it cannot be changed. ',
            link({ href: authDoc, target: '_blank' }, ['Read more about authorization domains'])
          ])
        }, [
          span({ style: { cursor: 'pointer', color: Style.colors.secondary } }, [
            icon('info-circle', { class: 'is-solid' })
          ])
        ])
      ]),
      h(Select, {
        searchable: false,
        multi: true,
        placeholder: 'Select groups',
        value: groups,
        onChange: data => this.setState({ groups: _.map('value', data) }),
        options: _.map(name => {
          return { label: name, value: name }
        }, _.map('groupName', allGroups).sort())
      }),
      createError && div({
        style: { marginTop: '1rem', color: Style.colors.error }
      }, [createError]),
      creating && spinnerOverlay
    ])
  }
}
