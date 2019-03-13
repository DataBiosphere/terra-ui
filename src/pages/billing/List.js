import * as Auth from 'src/libs/auth'
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
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


const billingProjectNameValidator = () => ({
  presence: { allowEmpty: false },
  length: { minimum: 6, maximum: 30 },
  format: {
    pattern: /^[a-z]([a-z0-9-])*$/,
    message: 'must start with a letter and can only contain lowercase letters, numbers, and hyphens.'
  }
})

const NewBillingProjectModal = ajaxCaller(class NewBillingProjectModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      billingProjectName: '',
      billingProjectNameTouched: false,
      billingAccount: '',
      alreadyExists: false
    }
  }

  async loadBillingAccounts() {
    const { ajax: { Billing } } = this.props
    try {
      const billingAccounts = await Billing.listAccounts()
      this.setState({ billingAccounts })
    } catch (error) {
      reportError('Error loading billing accounts', error)
    }
  }

  async componentDidMount() {
    this.loadBillingAccounts()
  }

  render() {
    const { onDismiss } = this.props
    const { billingProjectName, billingProjectNameTouched, submitting, chosenBillingAccount, billingAccounts, alreadyExists } = this.state
    const errors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator() })

    return h(Modal, {
      onDismiss,
      title: 'Create Billing Project',
      showCancel: !(billingAccounts && billingAccounts.length === 0),
      showButtons: !!billingAccounts,
      okButton: billingAccounts && billingAccounts.length !== 0 ?
        buttonPrimary({
          disabled: errors || !chosenBillingAccount || !chosenBillingAccount.firecloudHasAccess,
          onClick: () => this.submit()
        }, ['Create Billing Project']) :
        buttonPrimary({
          onClick: () => onDismiss()
        }, ['Ok'])
    }, [
      !billingAccounts && spinnerOverlay,
      billingAccounts && billingAccounts.length === 0 && h(Fragment, [
        `You don't have access to any billing accounts.  `,
        a({
          style: { color: colors.blue[0], fontWeight: 700 },
          href: `https://gatkforums.broadinstitute.org/firecloud/discussion/9762/howto-set-up-a-google-billing-account-non-broad-users`,
          target: '_blank'
        }, ['Learn how to create a billing account.  ', icon('pop-out', { size: 20 })])
      ]),
      billingAccounts && billingAccounts.length !== 0 && h(Fragment, [
        Forms.requiredFormLabel('Enter name'),
        !!alreadyExists && div({ style: { color: colors.red[0], fontSize: 11, fontWeight: 600 } }, [
          icon('exclamation-circle', { size: 24 }),
          `${alreadyExists} already exists. Choose another name.`
        ]),
        validatedInput({
          inputProps: {
            autoFocus: true,
            value: billingProjectName,
            onChange: e => this.setState({ billingProjectName: e.target.value, billingProjectNameTouched: true })
          },
          error: billingProjectNameTouched && Utils.summarizeErrors(errors && errors.billingProjectName)
        }),
        !(billingProjectNameTouched && errors) && Forms.formHint('Name must be unique and cannot be changed.'),
        Forms.requiredFormLabel('Select billing account'),
        div({ style: { fontSize: 14 } }, [
          h(Select, {
            isMulti: false,
            placeholder: 'Select billing account',
            value: chosenBillingAccount,
            onChange: selected => this.setState({ chosenBillingAccount: selected.value }),
            options: _.map(account => {
              return {
                value: account,
                label: account.displayName
              }
            }, billingAccounts)
          })
        ]),
        !!chosenBillingAccount && !chosenBillingAccount.firecloudHasAccess && div({ style: { fontWeight: 500, fontSize: 12 } }, [
          div({ style: { color: colors.red[0], margin: '0.25rem 0 0.25rem 0', fontSize: 13 } }, [
            'Terra does not have access to this account. To grant access, add ', span({ style: { fontWeight: 'bold' } }, 'billing@firecloud.org'),
            ' as a Billing Account User on the ',
            a({
              style: { color: colors.blue[0], fontWeight: 700 },
              href: `https://console.cloud.google.com/billing/${chosenBillingAccount.accountName.split('/')[1]}?authuser=${Auth.getUser().email}`,
              target: '_blank'
            }, ['Google Cloud Console ', icon('pop-out', { size: 12 })])
          ]),
          // The following lines will be re-added soon:
          // div({ style: { marginBottom: '0.25rem' } }, [
          //   '2. Click ',
          //   h(Clickable, {
          //     as: 'span',
          //     style: { color: colors.blue[0], fontWeight: 700 },
          //     onClick: () => {
          //       this.setState({ billingAccounts: undefined })
          //       this.loadBillingAccounts()
          //     }
          //   }, ['HERE']), ' to refresh your billing accounts.'
          // ]),
          div({ style: { marginTop: '0.5rem' } }, [
            'Need help? ',
            a({
              style: { color: colors.blue[0], fontWeight: 700 },
              href: `https://gatkforums.broadinstitute.org/firecloud/discussion/9762/howto-set-up-a-google-billing-account-non-broad-users`,
              target: '_blank'
            }, ['Click here ', icon('pop-out', { size: 12 })]), ' for more information.'
          ])
        ])
      ]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { onSuccess, ajax: { Billing } } = this.props
    const { billingProjectName, chosenBillingAccount } = this.state

    try {
      this.setState({ submitting: true })
      await Billing.createProject(billingProjectName, chosenBillingAccount.accountName)
      onSuccess()
    } catch (error) {
      switch (error.status) {
        case 409:
          this.setState({ alreadyExists: billingProjectName, submitting: false })
          break
        default:
          this.setState({ submitting: false })
          reportError('Error creating billing project', error)
      }
    }
  }
})

const ProjectCard = pure(({ project: { projectName, creationStatus, role } }) => {
  const isOwner = !!_.includes('Owner', role)
  const projectReady = creationStatus === 'Ready'
  const isClickable = isOwner && projectReady

  return div({ style: Style.cardList.longCard }, [
    div({ style: { flex: 'none' } }, [
      icon(projectReady ? 'check' : 'loadingSpinner', {
        style: {
          color: projectReady ? colors.green[0] : undefined,
          marginRight: '1rem'
        }
      }),
      creationStatus
    ]),
    div({ style: { flex: 1 } }, [
      a({
        href: isClickable ? Nav.getLink('project', { projectName }) : undefined,
        style: {
          ...Style.cardList.longTitle,
          marginLeft: projectReady ? '2rem' : '1rem', marginRight: '1rem',
          color: isClickable ? colors.green[0] : undefined
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
                  () => setTimeout(() => this.setState({ creatingBillingProject: true }), 250),
                  () => reportError('Failed to grant permissions', 'To create a new billing project, you must allow Terra to view your Google billing account(s).')
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
          onDismiss: () => this.setState({ creatingBillingProject: false }),
          onSuccess: () => this.refresh() // open the modal
        })
      ]),
      updating && spinnerOverlay
    ])
  }

  componentDidUpdate() {
    const { billingProjects } = this.state

    if (_.some({ creationStatus: 'Creating' }, billingProjects) && !this.interval) {
      this.interval = setInterval(() => this.refresh(), 10000)
    } else {
      clearInterval(this.interval)
      this.interval = undefined
    }

    StateHistory.update(_.pick(
      ['billingProjects', 'filter'],
      this.state)
    )
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }
})


export const addNavPaths = () => {
  Nav.defPath('billing', {
    path: '/billing',
    component: BillingList,
    title: 'Billing Management'
  })
}
