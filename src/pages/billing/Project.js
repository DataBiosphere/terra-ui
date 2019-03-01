import _ from 'lodash/fp'
import { Fragment } from 'react'
import { b, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, PageBox, search, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { textInput } from 'src/components/input'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Forms from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { styles } from 'src/pages/groups/common'
import { FlexTable, HeaderCell } from 'src/components/table'
import { AutoSizer } from 'react-virtualized'
import colors from 'src/libs/colors'
import Modal from 'src/components/Modal'
import validate from 'validate.js'

const NewUserModal = ajaxCaller(class NewUserModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      userEmail: ''
    }
  }

  render() {
    const { onDismiss } = this.props
    const { userEmail, role, submitting, submitError } = this.state

    const errors = validate({ userEmail }, { userEmail: { email: true } })

    return h(Modal, {
      onDismiss,
      title: 'Add user to Billing Project',
      okButton: buttonPrimary({
        tooltip: Utils.summarizeErrors(errors),
        onClick: () => this.submit(),
        disabled: errors || !role
      }, ['Add User'])
    }, [
      Forms.requiredFormLabel('User email'),
      textInput({
        autoFocus: true,
        value: userEmail,
        onChange: e => this.setState({ userEmail: e.target.value, emailTouched: true })
      }),
      Forms.requiredFormLabel('Role'),
      h(Select, {
        value: role,
        onChange: ({ value }) => this.setState({ role: value }),
        options: ['User', 'Owner']
      }),
      div({ style: { marginTop: '1rem' } },
        'Warning: Adding any user to this project will mean they can incur costs to the billing associated with this project. '),
      submitError && div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.red[0] } }, [submitError]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { projectName, onSuccess, ajax: { Billing } } = this.props
    const { userEmail, role } = this.state

    try {
      this.setState({ submitting: true })
      await Billing.project(projectName).addUser(role, userEmail)
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      if (400 <= error.status <= 499) {
        this.setState({ submitError: (await error.json()).message })
      } else {
        reportError('Error adding user', error)
      }
    }
  }
})

const EditUserModal = ajaxCaller(class EditUserModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      role: props.user.role
    }
  }

  render() {
    const { onDismiss, user: { email } } = this.props
    const { newRole, submitting } = this.state

    return h(Modal, {
      onDismiss,
      title: 'Edit Roles',
      okButton: buttonPrimary({
        onClick: () => this.submit()
      }, ['Change Role'])
    }, [
      div({ style: { marginBottom: '0.25rem' } }, [
        'Edit role for ',
        b([email])
      ]),
      h(Select, {
        value: newRole,
        onChange: ({ value }) => this.setState({ newRole: value }),
        options: ['User', 'Owner']
      }),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { projectName, user: { email, role }, onSuccess, ajax: { Billing } } = this.props
    const { newRole } = this.state

    try {
      this.setState({ submitting: true })
      await Billing.project(projectName).removeUser(role, email)
      await Billing.project(projectName).addUser(newRole, email)
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      reportError('Error updating user', error)
    }
  }
})


const DeleteUserModal = pure(({ onDismiss, onSubmit, userEmail }) => {
  return h(Modal, {
    onDismiss,
    title: 'Confirm',
    okButton: buttonPrimary({
      onClick: onSubmit
    }, ['Remove'])
  }, [
    div(['Are you sure you want to remove']),
    b(`${userEmail}?`)
  ])
})

export const ProjectUsersList = ajaxCaller(class ProjectUsersList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      projectUsers: null,
      addingUser: false,
      editingUser: false,
      deletingUser: false,
      updating: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { ajax: { Billing }, projectName } = this.props

    try {
      this.setState({ loading: true, addingUser: false, deletingUser: false, updating: false, editingUser: false })
      const rawProjectUsers = await Billing.project(projectName).listUsers()
      const projectUsers = _.flow(
        _.groupBy('email'),
        _.map(gs => ({ ...gs[0], role: _.map('role', gs) })),
        _.sortBy('email')
      )(rawProjectUsers)
      this.setState({ projectUsers, isDataLoaded: true })
    } catch (error) {
      reportError('Error loading billing project users list', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { projectName, ajax: { Billing } } = this.props
    const { projectUsers, updating, filter, addingUser, deletingUser, editingUser } = this.state

    return h(Fragment, [
      h(TopBar, { title: 'Billing', href: Nav.getLink('billing') }, [
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH USERS',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ]),
      h(PageBox, {
        style: {
          padding: '1.5rem',
          flex: 1
        }
      }, [
        div({ style: { ...styles.toolbarContainer, marginBottom: '1rem' } }, [
          div({
            style: {
              ...Style.elements.sectionHeader,
              textTransform: 'uppercase'
            }
          }, [`Billing Project - ${projectName}`]),
          h(Clickable, {
            style: { marginLeft: '1rem' },
            tooltip: 'Add user',
            onClick: () => this.setState({ addingUser: true })
          }, [
            icon('plus-circle', {
              size: 20,
              style: { color: colors.green[0] }
            })
          ])
        ]),
        projectUsers && !!projectUsers.length && h(AutoSizer, [
          ({ height }) => h(FlexTable, {
            width: 600,
            height,
            rowCount: projectUsers.length,
            columns: [
              {
                size: { basis: 200 },
                headerRenderer: () => h(HeaderCell, ['Email']),
                cellRenderer: ({ rowIndex }) => {
                  return projectUsers[rowIndex].email
                }
              },
              {
                size: { basis: 250, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Role']),
                cellRenderer: ({ rowIndex }) => {
                  return h(Fragment, [
                    _.join(', ', _.sortBy(_.identity, projectUsers[rowIndex].role)),
                    div({
                      style: {
                        marginLeft: 'auto',
                        color: colors.green[0],
                        display: 'flex'
                      }
                    }, [
                      h(Clickable, {
                        tooltip: 'Edit Role',
                        style: { marginRight: '0.5rem' },
                        onClick: () => this.setState({ editingUser: projectUsers[rowIndex] })
                      }, [icon('pencil')]),
                      h(Clickable, {
                        tooltip: 'Remove User',
                        onClick: () => this.setState({ deletingUser: projectUsers[rowIndex] })
                      }, [icon('trash')])
                    ])
                  ])
                }
              }
            ]
          })
        ]),
        addingUser && h(NewUserModal, {
          projectName,
          onDismiss: () => this.setState({ addingUser: false }),
          onSuccess: () => this.refresh()
        }),
        editingUser && h(EditUserModal, {
          user: editingUser, projectName,
          onDismiss: () => this.setState({ editingUser: false }),
          onSuccess: () => this.refresh()
        }),
        !!deletingUser && h(DeleteUserModal, {
          userEmail: deletingUser.email,
          onDismiss: () => this.setState({ deletingUser: false }),
          onSubmit: async () => {
            try {
              this.setState({ updating: true, deletingUser: false })
              await Billing.project(projectName).removeUser(deletingUser.role, deletingUser.email)
              this.refresh()
            } catch (error) {
              this.setState({ updating: false })
              reportError('Error removing member from billing project', error)
            }
          }
        }),
        updating && spinnerOverlay
      ])

    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['projectUsers', 'filter'],
      this.state)
    )
  }
})


export const addNavPaths = () => {
  Nav.defPath('project-users-list', {
    path: '/billing/:projectName',
    component: ProjectUsersList,
    title: ({ projectName }) => `Billing Management - ${projectName}`
  })
}
