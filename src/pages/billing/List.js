import Interactive from 'react-interactive'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
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


const ProjectTabs = pure(({ project: { projectName, role, creationStatus }, isActive }) => {
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
    href: Nav.getLink('billing', { projectName }),
    hover: isActive ? {} : { backgroundColor: colors.green[6], color: colors.green[1] }
  }, [
    div([
      projectName, statusIcon
    ])
  ]) : div({
    style: {
      display: 'flex', alignItems: 'center', fontSize: 16, height: 50, padding: '0 2rem',
      fontWeight: 500, overflow: 'hidden', borderBottom: `0.5px solid ${colors.grayBlue[2]}`,
      color: colors.gray[0], borderRightColor: colors.green[0], borderRightStyle: 'solid',
      borderRightWidth: 0, backgroundColor: colors.white
    }
  }, [projectName, statusIcon])
})

export const BillingList = ajaxCaller(class BillingList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      billingProjects: null,
      ...StateHistory.get()
    }
  }

  componentDidMount() {
    this.loadBillingProjects()
  }

  async loadBillingProjects() {
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

  async loadBillingAccounts() {
    const { ajax: { Billing } } = this.props
    try {
      const billingAccounts = await Billing.listAccounts()
      this.setState({ billingAccounts })
    } catch (error) {
      reportError('Error loading billing accounts', error)
    }
  }

  render() {
    const { billingProjects, isDataLoaded } = this.state
    const breadcrumbs = 'Billing > Billing Accounts'
    const { projectName } = this.props

    return h(Fragment, [
      h(TopBar, { title: 'Billing', href: Nav.getLink('billing') }, [
        !!projectName && div({
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
          }, [projectName])
        ])
      ]),
      div({ style: { display: 'flex', flex: 1, flexWrap: 'wrap' } }, [
        div({ style: { width: 367, boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)' } }, [
          div({
            style: {
              color: colors.gray[0], backgroundColor: colors.grayBlue[5], fontSize: 16, padding: '1.5rem',
              fontWeight: 600, textTransform: 'uppercase', borderBottom: `0.5px solid ${colors.grayBlue[2]}`
            }
          },
          ['Billing Accounts']),
          _.map(project => h(ProjectTabs, {
            project, key: `${project.projectName}`,
            isActive: project.projectName === projectName
          }), billingProjects),
          !isDataLoaded && spinnerOverlay
        ]),
        !!projectName && h(ProjectDetail, { projectName })
      ])
    ])
  }

  componentDidUpdate() {
    const { billingProjects } = this.state

    if (_.some({ creationStatus: 'Creating' }, billingProjects) && !this.interval) {
      this.interval = setInterval(() => this.loadBillingProjects(), 10000)
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
    path: '/billing/:projectName?',
    component: BillingList,
    title: ({ projectName }) => `Billing ${projectName ? `- ${projectName}`  : 'Management'}`
  })
}
