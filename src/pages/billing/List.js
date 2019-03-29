import Interactive from 'react-interactive'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import _ from 'lodash/fp'
import { icon } from 'src/components/icons'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import ProjectDetail from 'src/pages/billing/Project'
import AccountDetail from 'src/pages/billing/Account'
import { listProjectsWithAccounts } from 'src/libs/billing'


const ProjectTabs = ({ project: { projectName, role, creationStatus }, isActive }) => {
  const isOwner = !!_.includes('Owner', role)
  const projectReady = creationStatus === 'Ready'
  const isClickable = isOwner && projectReady
  const statusIcon = span({ style: { marginLeft: '0.5rem' } }, [
    icon(Utils.cond(
      [creationStatus === 'Ready', 'check'],
      [creationStatus === 'Creating', 'loadingSpinner'],
      'error-standard'), {
      style: { color: colors.green[0], marginRight: '1rem' }
    })
  ])

  return isClickable ? h(Interactive, {
    as: 'a',
    style: {
      display: 'flex', alignItems: 'center', fontSize: 16, height: 50, padding: '0 2rem',
      fontWeight: 500, overflow: 'hidden', borderBottom: `0.5px solid ${colors.grayBlue[2]}`,
      color: colors.green[0], borderRightColor: isActive ? colors.green[1] : colors.green[0], borderRightStyle: 'solid',
      borderRightWidth: isActive ? 10 : 0, backgroundColor: isActive ? colors.green[7] : colors.white
    },
    href: Nav.getLink('billing', { selectedName: `project ${projectName}` }),
    hover: isActive ? {} : { backgroundColor: colors.green[6], color: colors.green[1] }
  }, [projectName, statusIcon]) : div({
    style: {
      display: 'flex', alignItems: 'center', fontSize: 16, height: 50, padding: '0 2rem',
      fontWeight: 500, overflow: 'hidden', borderBottom: `0.5px solid ${colors.grayBlue[2]}`,
      color: colors.gray[0], borderRightColor: colors.green[0], borderRightStyle: 'solid',
      borderRightWidth: 0, backgroundColor: colors.white
    }
  }, [projectName, statusIcon])
}

const AccountTabs = ({ account: { accountName, firecloudHasAccess, displayName }, isActive }) => {
  //console.log(accountName)
  return h(Interactive, {
    as: 'a',
    style: {
      display: 'flex', alignItems: 'center', fontSize: 16, height: 50, padding: '0 2rem',
      fontWeight: 500, overflow: 'hidden', borderBottom: `0.5px solid ${colors.grayBlue[2]}`,
      color: colors.green[0], borderRightColor: isActive ? colors.green[1] : colors.green[0], borderRightStyle: 'solid',
      borderRightWidth: isActive ? 10 : 0, backgroundColor: isActive ? colors.green[7] : colors.white
    },
    href: Nav.getLink('billing', { selectedName: `account ${accountName}` }),
    hover: isActive ? {} : { backgroundColor: colors.green[6], color: colors.green[1] }
  }, [div([icon(isActive ? 'angle down' : 'angle right', { style: { marginRight: '0.5rem', marginLeft: '-1.5rem' } }), accountName.split('/')[1]])])
}


export const BillingList = ajaxCaller(class BillingList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      billingProjects: null,
      ...StateHistory.get()
    }
  }

  async componentDidMount() {
    //const { billingAccounts } = this.state
    const { ajax: { Billing } } = this.props
    this.loadProjects()
    this.loadAccounts()
    this.listProjectsInAccounts(await Billing.listAccounts())
  }

  async listProjectsInAccounts(billingAccounts) {
    try {
      this.setState({ isDataLoaded: false })
      const projectsInAccounts = await listProjectsWithAccounts(billingAccounts)
      console.log('success')
      console.log({ projectsInAccounts })
      this.setState({ projectsInAccounts })
    } catch (error) {
      reportError('Error loading projects within accounts', error)
    } finally {
      this.setState({ isDataLoaded: true })
    }
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

  async loadAccounts() {
    const { ajax: { Billing } } = this.props

    try {
      this.setState({ isDataLoaded: false })
      const billingAccounts = await Billing.listAccounts()
      this.setState({ billingAccounts, isDataLoaded: true })
    } catch (error) {
      this.setState({ isDataLoaded: true })
      reportError('Error loading billing accounts', error)
    }
  }

  render() {
    const { billingProjects, billingAccounts, isDataLoaded } = this.state
    const breadcrumbs = 'Billing > Billing Accounts'
    const { selectedName } = this.props
    const isAccount = _.startsWith('a', selectedName)

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
          }, [isAccount ? selectedName.split('%2F')[1] : selectedName.split(' ')[1]])
        ])
      ]),
      div({ style: { display: 'flex', flex: 1, flexWrap: 'wrap' } }, [
        div({ style: { width: 367, boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)' } }, [

          //begin accounts
          div({
            style: {
              color: colors.gray[0], backgroundColor: colors.grayBlue[5], fontSize: 16, padding: '1.5rem',
              fontWeight: 600, textTransform: 'uppercase', borderBottom: `0.5px solid ${colors.grayBlue[2]}`
            }
          },
          ['Billing Accounts']),
          _.map(account => h(AccountTabs, {
            account, key: `${account.accountName}`,
            isActive: !!selectedName && isAccount && account.accountName.split('/')[1] === selectedName.split('%2F')[1]
          }), billingAccounts),

          //begin projects
          div({
            style: {
              color: colors.gray[0], backgroundColor: colors.grayBlue[5], fontSize: 16, padding: '1.5rem',
              fontWeight: 600, textTransform: 'uppercase', borderBottom: `0.5px solid ${colors.grayBlue[2]}`
            }
          },
          ['Billing Projects']),
          _.map(project => h(ProjectTabs, {
            project, key: `${project.projectName}`,
            isActive: !!selectedName && !isAccount && project.projectName === selectedName.split(' ')[1]
          }), billingProjects)
        ]),
        !!selectedName && (isAccount ? h(AccountDetail, { accountName: selectedName.split('%2F')[1] }) : h(ProjectDetail, { projectName: selectedName.split(' ')[1] })),
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
    path: '/billing/:selectedName?',
    component: BillingList,
    title: ({ selectedName }) => `Billing ${selectedName ? `- ${selectedName}` : 'Management'}`
  })
}
