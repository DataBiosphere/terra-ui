import Interactive from 'react-interactive'
import * as Auth from 'src/libs/auth'
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, Select, spinnerOverlay } from 'src/components/common'
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
      existing: []
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
    const { billingProjectName, billingProjectNameTouched, submitting, chosenBillingAccount, billingAccounts, existing } = this.state
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

const ProjectTabs = pure(({ project: { projectName, role, creationStatus } }, /*isActive*/ ) => {
  const isOwner = !!_.includes('Owner', role)
  const projectReady = creationStatus === 'Ready'
  const isClickable = isOwner && projectReady
  const isActive = false

  return h(Interactive, {
    as: 'a',
    style: {
      display: 'flex', alignItems: 'center', flex: 'none',
      height: 50, padding: '0 45px',
      fontWeight: 500, fontSize: 16, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      color: isClickable ? colors.green[0] : colors.gray[0],
      borderRightWidth: isActive ? 10 : 0, borderRightStyle: 'solid', borderRightColor: colors.green[1],
      backgroundColor: isActive ? colors.green[7] : colors.white,
      borderBottom: isActive ? undefined : `0.5px solid ${colors.grayBlue[2]}`
    },
    href: isClickable ? Nav.getLink('project', { projectName }) : undefined,
    hover: isActive ? {} : { backgroundColor: colors.green[6], color: colors.green[1] }
  }, [div([projectName])])
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
    //this.loadBillingAccounts()
  }

  // async loadBillingAccounts() {
  //   const { ajax: { Billing } } = this.props
  //   try {
  //     const billingAccounts = await Billing.listAccounts()
  //     this.setState({ billingAccounts })
  //   } catch (error) {
  //     reportError('Error loading billing accounts', error)
  //   }
  // }

  render() {
    const { billingProjects, isDataLoaded, creatingBillingProject, updating } = this.state
    //const { breadcrumbs, title } = this.props
    const breadcrumbs = 'Billing > this is a breadcrumb'
    const title = 'First Billing account detail page'

    return h(Fragment, [
      h(TopBar, { title: 'Billing', href: Nav.getLink('billing') }, [
        div({
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
          }, [title])
        ])
      ]),
      div({ style: { display: 'flex', flex: 1, flexWrap: 'wrap'  } }, [
        div({ style: { width: 290, boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)' } }, [
          div({
            style: {
              color: colors.gray[0], backgroundColor: colors.grayBlue[5], fontSize: 16,
              fontWeight: 600, textTransform: 'uppercase', padding: 25, borderBottom: `0.5px solid ${colors.grayBlue[2]}`
            }
          },
          ['Billing Accounts', icon('plus-circle', { size: 16 })]),
          // h(NewBillingProjectCard, {
          //   onClick: () => {
          //     if (Auth.getAuthInstance().currentUser.get().hasGrantedScopes('https://www.googleapis.com/auth/cloud-billing')) {
          //       this.setState({ creatingBillingProject: true })
          //     } else {
          //       const options = new window.gapi.auth2.SigninOptionsBuilder({ 'scope': 'https://www.googleapis.com/auth/cloud-billing' })
          //       Auth.getAuthInstance().currentUser.get().grant(options).then(
          //         () => setTimeout(() => this.setState({ creatingBillingProject: true }), 250),
          //         () => reportError('Failed to grant permissions', 'To create a new billing project, you must allow Terra to view your Google billing account(s).')
          //       )
          //     }
          //   }
          // }),
          div([
            _.map(project => h(ProjectTabs, { project }), billingProjects)
          ]),
          (!isDataLoaded || updating) && spinnerOverlay
        ])
      ]),
      creatingBillingProject && h(NewBillingProjectModal, {
        onDismiss: () => this.setState({ creatingBillingProject: false }),
        onSuccess: () => this.refresh()
      })
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
