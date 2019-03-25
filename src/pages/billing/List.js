import Interactive from 'react-interactive'
import * as Auth from 'src/libs/auth'
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import { Component } from 'src/libs/wrapped-components'
import ProjectUsersList from 'src/pages/billing/Project'

const ProjectTabs = pure(({ project: { projectName, role, creationStatus } }, /*isActive*/) => {
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
    href: Nav.getLink('billing', { projectName }),
    hover: isActive ? {} : { backgroundColor: colors.green[6], color: colors.green[1] }
  }, [div([projectName])])
})

export const BillingList = ajaxCaller(class BillingList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      billingProjects: null,
      updating: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { ajax: { Billing } } = this.props

    try {
      this.setState({ isDataLoaded: false, updating: false })
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
    if (Auth.getAuthInstance().currentUser.get().hasGrantedScopes('https://www.googleapis.com/auth/cloud-billing')) {
      this.refresh()
    } else {
      const options = new window.gapi.auth2.SigninOptionsBuilder({ 'scope': 'https://www.googleapis.com/auth/cloud-billing' })
      Auth.getAuthInstance().currentUser.get().grant(options).then(
        () => setTimeout(() => this.refresh(), 250),
        () => reportError('Failed to grant permissions', //TODO user can still view something?
          'To create a new billing project, you must allow Terra to view your Google billing account(s).')
      )
    }
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
    const { billingProjects, isDataLoaded, updating } = this.state
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
          _.map(project => h(ProjectTabs, { project, key: `${project.projectName}` }), billingProjects),
          (!isDataLoaded || updating) && spinnerOverlay
        ]),
        h(ProjectUsersList, { projectName: 'asdff123123' })
      ])
    ])
  }

  componentDidUpdate() {
    const { billingProjects } = this.state

    if (_.some({ creationStatus: 'Creating' }, billingProjects) && !this.interval) { //TODO move this?
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
    clearInterval(this.interval) //TODO move this?
  }
})


export const addNavPaths = () => {
  Nav.defPath('billing', {
    path: '/billing',
    component: BillingList,
    title: 'Billing Management'
  })
}
