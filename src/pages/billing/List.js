import * as Auth from 'src/libs/auth'
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, PageBox, search, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Forms from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const billingProjectNameValidator = existing => ({
  presence: { allowEmpty: false },
  length: { minimum: 6, maximum: 30 },
  format: {
    pattern: /^[a-z]([a-z0-9-])*$/,
    message: 'must start with a letter and can only contain lowercase letters, numbers, and hyphens.'
  },
  exclusion: {
    within: existing,
    message: 'already exists'
  }
})

const NewBillingProjectModal = ajaxCaller(class NewBillingProjectModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      billingProjectName: '',
      billingProjectNameTouched: false,
      existingBillingProjects: undefined,
      billingAccount: ''
    }
  }

  async componentDidMount() {
    const { ajax: { Billing } } = this.props
    try {
      const billingAccounts = await Billing.listAccounts()
      console.log(billingAccounts)
      this.setState({ billingAccounts })
    } catch (error) {
      reportError('Error loading billing accounts', error)
    }
  }

  render() {
    const { onDismiss, existingBillingProjects } = this.props
    const { billingProjectName, billingProjectNameTouched, submitting, chosenBillingAccount, billingAccounts } = this.state
    const errors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existingBillingProjects) })

    return h(Modal, {
      onDismiss,
      title: 'Create New Billing Project',
      okButton: buttonPrimary({
        disabled: errors,
        onClick: () => this.submit()
      }, ['Create Billing Project'])
    }, [
      Forms.requiredFormLabel('Enter name'),
      validatedInput({
        inputProps: {
          autoFocus: true,
          value: billingProjectName,
          onChange: e => this.setState({ billingProjectName: e.target.value, billingProjectNameTouched: true })
        },
        error: billingProjectNameTouched && Utils.summarizeErrors(errors && errors.billingProjectName)
      }),
      !(billingProjectNameTouched && errors) && Forms.formHint('Name must be unique and cannot be changed.'),
      Forms.requiredFormLabel('Select billing account',
        div({ style: { fontWeight: 300, fontSize: 14 } }, [
          !!billingAccounts ?
            h(Select, {
              isMulti: false,
              placeholder: 'Select billing account',
              value: chosenBillingAccount,
              getOptionLabel: value => value.displayName,
              getOptionsValue: value => value.accountName,
              rawValue: true,
              onChange: selected => this.setState({ chosenBillingAccount: selected }),
              options: billingAccounts
            }) : spinnerOverlay
        ]),
        !!chosenBillingAccount && !chosenBillingAccount.firecloudHasAccess && div({ style: { fontWeight: 300, fontSize: 13 } },
          'To grant Terra access to an account, enter its console and add billing@firecloud.org as a Billing Account User.')),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { onSuccess, ajax: { Billing } } = this.props
    const { billingProjectName, billingAccount } = this.state

    try {
      this.setState({ submitting: true })
      await Billing.createProject(billingProjectName, billingAccount)
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      reportError('Error creating billing project', error)
    }
  }
})

const ProjectCard = pure(({ project: { projectName, creationStatus, role } }) => {
  const isOwner = !!_.includes('Owner', role)
  const projectReady = creationStatus === 'Ready'

  return div({ style: Style.cardList.longCard }, [
    div({ style: { flex: 'none' } }, [
      icon(projectReady ? 'check' : 'bars', {
        style: {
          color: projectReady ? colors.green[0] : undefined,
          marginRight: '1rem'
        }
      }),
      creationStatus
    ]),
    div({ style: { flex: 1 } }, [
      a({
        href: isOwner ? Nav.getLink('project', { projectName }) : undefined,
        style: {
          ...Style.cardList.longTitle,
          marginLeft: '2rem', marginRight: '1rem',
          color: isOwner ? colors.green[0] : undefined
        }
      }, [projectName])
    ]),
    div({ style: { width: 100 } }, [isOwner ? 'Owner' : 'Member'])
  ])
})

const NewBillingProjectCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: Style.cardList.shortCreateCard,
    onClick
  }, [
    div(['Create a']),
    div(['New Project']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
  ])
})

export const BillingList = ajaxCaller(class BillingList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      billingProjects: null,
      creatingBillingProject: false,
      updating: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { ajax: { Billing } } = this.props

    try {
      this.setState({ isDataLoaded: false, creatingBillingProject: false, updating: false })
      const rawBillingProjects = await Billing.listProjects()
      const billingProjects = _.flow(
        _.groupBy('projectName'),
        _.map(gs => ({ ...gs[0], role: _.map('role', gs) })),
        _.sortBy('projectName')
      )(rawBillingProjects)
      this.setState({ billingProjects, isDataLoaded: true })
    } catch (error) {
      reportError('Error loading billing projects list', error)
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { billingProjects, isDataLoaded, filter, creatingBillingProject, updating } = this.state
    return h(Fragment, [
      h(TopBar, { title: 'Billing' }, [
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH BILLING PROJECTS',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ]),
      h(PageBox, [
        div({ style: Style.cardList.toolbarContainer }, [
          div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Billing Projects Management']) //Billing Projects? Billing Management? Billing Project Management?
        ]),
        div({ style: Style.cardList.cardContainer }, [
          h(NewBillingProjectCard, {
            onClick: () => {
              if (Auth.getAuthInstance().currentUser.get().hasGrantedScopes('https://www.googleapis.com/auth/cloud-billing')) {
                this.setState({ creatingBillingProject: true })
              } else {
                const options = new window.gapi.auth2.SigninOptionsBuilder({ 'scope': 'https://www.googleapis.com/auth/cloud-billing' })
                Auth.getAuthInstance().currentUser.get().grant(options).then(
                  () => this.setState({ creatingBillingProject: true }),
                  e => reportError('Failed to grant permissions', e)
                )
              }
            }
          }),
          div({ style: { flexGrow: 1 } }, [
            _.flow(
              _.filter(({ projectName }) => Utils.textMatch(filter, projectName)),
              _.map(project => {
                return h(ProjectCard, {
                  project, key: `${project.projectName}`
                })
              })
            )(billingProjects)
          ]),
          !isDataLoaded && spinnerOverlay
        ]),
        creatingBillingProject && h(NewBillingProjectModal, {
          existingBillingProjects: _.map('billingProjectName', billingProjects),
          onDismiss: () => this.setState({ creatingBillingProject: false }),
          onSuccess: () => this.refresh() // open the modal
        })
      ]),
      updating && spinnerOverlay
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['billingProjects', 'filter'],
      this.state)
    )
  }
})


export const addNavPaths = () => {
  Nav.defPath('billing', {
    path: '/billing',
    component: BillingList,
    title: 'Billing Management'
  })
}
