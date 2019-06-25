import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { buttonPrimary, Clickable, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import TopBar from 'src/components/TopBar'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import { formHint, RequiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { authStore, freeCreditsActive } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import ProjectDetail from 'src/pages/billing/Project'
import validate from 'validate.js'


const ProjectTab = ({ project: { projectName, role, creationStatus }, isActive }) => {
  const projectReady = creationStatus === 'Ready'
  const statusIcon = icon(creationStatus === 'Creating' ? 'loadingSpinner' : 'error-standard',
    { style: { color: colors.accent(), marginRight: '1rem', marginLeft: '0.5rem' } })

  return _.includes('Owner', role) && projectReady ?
    h(Interactive, {
      as: 'a',
      style: { ...Style.navList.item(isActive), color: colors.accent() },
      href: `${Nav.getLink('billing')}?${qs.stringify({ selectedName: projectName, type: 'project' })}`,
      hover: Style.navList.itemHover(isActive)
    }, [projectName, !projectReady && statusIcon]) :
    div({ style: { ...Style.navList.item(false), color: colors.dark() } }, [projectName, !projectReady && statusIcon])
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
      isBusy: false,
      chosenBillingAccount: '',
      billingAccounts: undefined
    }
  }

  async componentDidMount() {
    this.loadAccounts()
  }

  loadAccounts = _.flow(
    withErrorReporting('Error loading billing accounts'),
    Utils.withBusyState(v => this.setState({ isBusy: v }))
  )(async () => {
    const { ajax: { Billing } } = this.props
    await Auth.ensureBillingScope()
    const billingAccounts = await Billing.listAccounts()
    this.setState({ billingAccounts })
  })

  render() {
    const { onDismiss } = this.props
    const { billingProjectName, billingProjectNameTouched, chosenBillingAccount, existing, isBusy, billingAccounts } = this.state
    const errors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existing) })

    return h(Modal, {
      onDismiss,
      shouldCloseOnOverlayClick: false,
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
      billingAccounts && billingAccounts.length === 0 && h(Fragment, [
        `You don't have access to any billing accounts.  `,
        a({
          style: { color: colors.accent(), fontWeight: 700 },
          href: `https://support.terra.bio/hc/en-us/articles/360026182251`,
          ...Utils.newTabLinkProps
        }, ['Learn how to create a billing account.', icon('pop-out', { size: 20, style: { marginLeft: '0.5rem' } })])
      ]),
      billingAccounts && billingAccounts.length !== 0 && h(Fragment, [
        h(RequiredFormLabel, ['Enter name']),
        h(ValidatedInput, {
          inputProps: {
            autoFocus: true,
            value: billingProjectName,
            onChange: v => this.setState({ billingProjectName: v, billingProjectNameTouched: true })
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
        !!chosenBillingAccount && !chosenBillingAccount.firecloudHasAccess && div({ style: { fontWeight: 500, fontSize: 13 } }, [
          div({ style: { margin: '0.25rem 0 0.25rem 0', color: colors.danger() } },
            'Terra does not have access to this account. '),
          div({ style: { marginBottom: '0.25rem' } }, ['To grant access, add ', span({ style: { fontWeight: 'bold' } }, 'terra-billing@terra.bio'),
            ' as a ', span({ style: { fontWeight: 'bold' } }, 'Billing Account User'), ' on the ',
            a({
              style: { color: colors.accent(), fontWeight: 700 },
              href: `https://console.cloud.google.com/billing/${chosenBillingAccount.accountName.split('/')[1]}?authuser=${Auth.getUser().email}`,
              ...Utils.newTabLinkProps
            }, ['Google Cloud Console', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])]),
          div({ style: { marginBottom: '0.25rem' } }, ['Then, ',
            h(Clickable, {
              as: 'span',
              style: { color: colors.accent(), fontWeight: 700 },
              onClick: () => {
                this.setState({ billingAccounts: undefined })
                this.loadAccounts()
              }
            }, ['click here']), ' to refresh your billing accounts.']),
          div({ style: { marginTop: '0.5rem' } }, [
            a({
              style: { color: colors.accent(), fontWeight: 700 },
              href: `https://support.terra.bio/hc/en-us/articles/360026182251`,
              ...Utils.newTabLinkProps
            }, ['Need help?', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])
          ])
        ])
      ]),
      (isBusy || !billingAccounts) && spinnerOverlay
    ])
  }

  submit = _.flow(
    withErrorReporting('Error creating billing project'),
    Utils.withBusyState(v => this.setState({ isBusy: v }))
  )(async () => {
    const { onSuccess } = this.props
    const { billingProjectName, chosenBillingAccount, existing } = this.state
    try {
      await Ajax().Billing.createProject(billingProjectName, chosenBillingAccount.accountName)
      onSuccess()
    } catch (error) {
      if (error.status === 409) {
        this.setState({ existing: _.concat(billingProjectName, existing) })
      } else {
        throw error
      }
    }
  })
})

export const BillingList = _.flow(
  ajaxCaller,
  Utils.connectAtom(authStore, 'authState')
)(class BillingList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      billingProjects: null,
      creatingBillingProject: false,
      ...StateHistory.get()
    }
  }

  async componentDidMount() {
    this.loadProjects()
  }

  loadProjects = _.flow(
    withErrorReporting('Error loading billing projects list'),
    Utils.withBusyState(v => this.setState({ isBusy: v }))
  )(async () => {
    const { ajax: { Billing } } = this.props
    const rawBillingProjects = await Billing.listProjects()
    const billingProjects = _.flow(
      _.groupBy('projectName'),
      _.map(gs => ({ ...gs[0], role: _.map('role', gs) })),
      _.sortBy('projectName')
    )(rawBillingProjects)
    this.setState({ billingProjects })
  })

  render() {
    const { billingProjects, isBusy, creatingBillingProject } = this.state
    const { queryParams: { selectedName }, authState: { profile } } = this.props
    const { trialState } = profile
    const hasFreeCredits = trialState === 'Enabled'
    const breadcrumbs = `Billing > Billing Project`
    return h(Fragment, [
      h(TopBar, { title: 'Billing', href: Nav.getLink('billing') }, [
        !!selectedName && div({
          style: {
            color: 'white', paddingLeft: '5rem', minWidth: 0, marginRight: '0.5rem'
          }
        }, [
          div(breadcrumbs),
          div({ style: Style.breadcrumb.textUnderBreadcrumb }, [selectedName])
        ])
      ]),
      div({ style: { display: 'flex', flex: 1, position: 'relative' } }, [
        div({ style: { width: 330, boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)' } }, [
          div({ style: Style.navList.heading }, [
            'Billing Projects',
            h(Clickable,
              { onClick: () => { this.setState({ creatingBillingProject: true }) } },
              [icon('plus-circle', { size: 21, style: { color: colors.accent() } })]
            )
          ]),
          hasFreeCredits && h(Clickable, {
            style: { ...Style.navList.heading, color: colors.light(), backgroundColor: colors.accent() },
            hover: { backgroundColor: colors.accent(0.85) },
            onClick: () => freeCreditsActive.set(true)
          }, ['Click for $300 free credits']),
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
        !!selectedName && billingProjects && h(ProjectDetail, { key: selectedName, project: _.find({ projectName: selectedName }, billingProjects) }),
        isBusy && spinnerOverlay
      ])
    ])
  }

  componentDidUpdate() {
    const { billingProjects } = this.state
    const anyProjectsCreating = _.some({ creationStatus: 'Creating' }, billingProjects)

    if (anyProjectsCreating && !this.interval) {
      this.interval = setInterval(() => this.loadProjects(), 10000)
    } else if (!anyProjectsCreating && this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }

    StateHistory.update(_.pick(
      ['billingProjects'],
      this.state)
    )
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }
})


export const navPaths = [
  {
    name: 'billing',
    path: '/billing',
    component: BillingList,
    title: 'Billing'
  }
]
