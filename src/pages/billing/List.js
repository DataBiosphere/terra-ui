import _ from 'lodash/fp'
import * as qs from 'qs'
import Interactive from 'react-interactive'
import { Fragment } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { buttonPrimary, buttonSecondary, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { formHint, RequiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import ProjectDetail from 'src/pages/billing/Project'
import validate from 'validate.js'


const ProjectTab = ({ project: { projectName, role, creationStatus }, isActive }) => {
  const isOwner = !!_.includes('Owner', role)
  const projectReady = creationStatus === 'Ready'
  const projectParams = { selectedName: projectName, type: 'project' }
  const isClickable = isOwner && projectReady
  const statusIcon = icon(creationStatus === 'Creating' ? 'loadingSpinner' : 'error-standard',
    { style: { color: colors.green[0], marginRight: '1rem', marginLeft: '0.5rem' } })

  return isClickable ? h(Interactive, {
    as: 'a',
    style: {
      display: 'flex', alignItems: 'center', fontSize: 16, height: 50, padding: '0 2rem',
      fontWeight: 500, overflow: 'hidden', borderBottom: `1px solid ${colors.grayBlue[2]}`,
      color: colors.green[0], borderRightColor: isActive ? colors.green[1] : colors.green[0], borderRightStyle: 'solid',
      borderRightWidth: isActive ? 10 : 0, backgroundColor: isActive ? colors.green[7] : colors.white
    },
    href: `${Nav.getLink('billing')}?${qs.stringify(projectParams)}`,
    hover: isActive ? {} : { backgroundColor: colors.green[6], color: colors.green[1] }
  }, [projectName, !projectReady && statusIcon]) : div({
    style: {
      display: 'flex', alignItems: 'center', fontSize: 16, height: 50, padding: '0 2rem',
      fontWeight: 500, overflow: 'hidden', borderBottom: `1px solid ${colors.grayBlue[2]}`,
      color: colors.gray[0], borderRightColor: colors.green[0], borderRightStyle: 'solid',
      borderRightWidth: 0, backgroundColor: colors.white
    }
  }, [projectName, !projectReady && statusIcon])
}

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
      existing: [],
      isDataLoaded: true
    }
  }

  componentDidMount() {
    this.loadAccounts()
  }

  async loadAccounts() {
    const { ajax: { Billing } } = this.props

    try {
      this.setState({ isDataLoaded: false })
      await Auth.ensureBillingScope()
      const billingAccounts = await Billing.listAccounts()
      this.setState({ billingAccounts, isDataLoaded: true })
    } catch (error) {
      this.setState({ isDataLoaded: true })
      reportError('Error loading billing accounts', error)
    }
  }

  render() {
    const { onDismiss } = this.props
    const { billingProjectName, billingProjectNameTouched, submitting, chosenBillingAccount, existing, isDataLoaded, billingAccounts } = this.state
    const errors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existing) })

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
        h(RequiredFormLabel, ['Enter name']),
        validatedInput({
          inputProps: {
            autoFocus: true,
            value: billingProjectName,
            onChange: e => this.setState({ billingProjectName: e.target.value, billingProjectNameTouched: true })
          },
          error: billingProjectNameTouched && Utils.summarizeErrors(errors && errors.billingProjectName)
        }),
        !(billingProjectNameTouched && errors) && formHint('Name must be unique and cannot be changed.'),
        h(RequiredFormLabel, ['Select billing account']),
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
      (submitting || !isDataLoaded) && spinnerOverlay
    ])
  }

  async submit() {
    const { onSuccess, ajax: { Billing } } = this.props
    const { billingProjectName, chosenBillingAccount, existing } = this.state

    try {
      this.setState({ submitting: true })
      await Billing.createProject(billingProjectName, chosenBillingAccount.accountName)
      onSuccess()
    } catch (error) {
      switch (error.status) {
        case 409:
          this.setState({ existing: _.concat(billingProjectName, existing), submitting: false })
          break
        default:
          reportError('Error creating billing project', error)
      }
    } finally {
      this.setState({ submitting: false })
    }
  }
})

export const BillingList = ajaxCaller(class BillingList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      billingProjects: null,
      creatingBillingProject: false,
      ...StateHistory.get()
    }
  }

  async componentDidMount() {
    this.loadProjects()
  }

  async loadProjects() {
    const { ajax: { Billing } } = this.props

    try {
      this.setState({ isDataLoaded: false })
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

  render() {
    const { billingProjects, isDataLoaded, creatingBillingProject } = this.state
    const { queryParams: { selectedName } } = this.props
    const breadcrumbs = `Billing > Billing Project`

    return h(Fragment, [
      h(TopBar, { title: 'Billing', href: Nav.getLink('billing') }, [
        !!selectedName && div({
          style: {
            color: 'white', paddingLeft: '5rem', minWidth: 0, marginRight: '0.5rem'
          }
        }, [
          div(breadcrumbs),
          div({
            style: {
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontSize: '1.25rem', overflowX: 'hidden'
            }
          }, [selectedName])
        ])
      ]),
      div({ style: { display: 'flex', flex: 1 } }, [
        div({ style: { width: 330, boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)' } }, [
          div({
            style: {
              color: colors.gray[0], backgroundColor: colors.grayBlue[5], fontSize: 16, padding: '1rem 1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontWeight: 600, textTransform: 'uppercase', borderBottom: `0.5px solid ${colors.grayBlue[2]}`
            }
          }, [
            'Billing Projects',
            buttonSecondary({
              onClick: () => { this.setState({ creatingBillingProject: true }) },
              style: {
                borderRadius: 5, backgroundColor: 'white', padding: '0.5rem',
                boxShadow: Style.standardShadow
              }
            },
            ['New', icon('plus-circle', { size: 21, style: { marginLeft: '0.5rem' } })])

          ]),
          _.map(project => h(ProjectTab, {
            project, key: project.projectName,
            isActive: !!selectedName && project.projectName === selectedName
          }), billingProjects)
        ]),
        creatingBillingProject && h(NewBillingProjectModal, {
          onDismiss: () => this.setState({ creatingBillingProject: false }),
          onSuccess: () => {
            this.setState({ creatingBillingProject: false })
            this.loadProjects()
          }
        }),
        !!selectedName && h(ProjectDetail, { key: selectedName, project: _.find({ projectName: selectedName }, billingProjects) }),
        !isDataLoaded && spinnerOverlay
      ])
    ])
  }

  componentDidUpdate() {
    const { billingProjects } = this.state

    if (_.some({ creationStatus: 'Creating' }, billingProjects) && !this.interval) {
      this.interval = setInterval(() => this.loadProjects(), 10000)
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
    title: ({ selectedName }) => `Billing ${selectedName ? `- ${selectedName}` : 'Management'}`
  })
}
