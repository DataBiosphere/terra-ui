import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { PageBox, search, spinnerOverlay, link } from 'src/components/common'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import { styles } from 'src/pages/groups/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { FlexTable, HeaderCell } from 'src/components/table'
import { AutoSizer } from 'react-virtualized'

export const BillingList = ajaxCaller(class BillingList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      billingProjects: null,
      ...StateHistory.get()
    }
  }

  async refresh() {
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

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { billingProjects, isDataLoaded, filter } = this.state
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
      h(PageBox, {
        style: {
          padding: '1.5rem',
          flex: 1
        }
      }, [
        div({ style: styles.toolbarContainer }, [
          div({
            style: {
              ...Style.elements.sectionHeader,
              textTransform: 'uppercase',
              marginBottom: '1rem'
            }
          }, [
            'Billing Projects Management'
          ])
        ]),
        billingProjects && !!billingProjects.length && h(AutoSizer, [
          ({ height }) => h(FlexTable, {
            width: 600,
            height,
            rowCount: billingProjects.length,
            columns: [
              {
                size: {
                  basis: 120,
                  grow: 0
                },
                headerRenderer: () => h(HeaderCell, ['Status']),
                cellRenderer: ({ rowIndex }) => {
                  const projectReady = billingProjects[rowIndex].creationStatus === 'Ready'
                  return h(Fragment, [
                    icon(projectReady ? 'check' : 'bars', {
                      style: {
                        color: projectReady ? colors.green[0] : undefined,
                        marginRight: '1rem'
                      }
                    }),
                    billingProjects[rowIndex].creationStatus
                  ])
                }
              },
              {
                size: { basis: 200 },
                headerRenderer: () => h(HeaderCell, ['Project Name']),
                cellRenderer: ({ rowIndex }) => {
                  const isOwner = !!_.includes('Owner', billingProjects[rowIndex].role)
                  const projectName = billingProjects[rowIndex].projectName
                  return isOwner ? link({
                    href: Nav.getLink('project-users-list', { projectName })
                  }, [projectName]) : projectName
                }
              },
              {
                size: {
                  basis: 150,
                  grow: 0
                },
                headerRenderer: () => h(HeaderCell, ['Role']),
                cellRenderer: ({ rowIndex }) => billingProjects[rowIndex].role
              }
            ]
          })
        ]),
        !isDataLoaded && spinnerOverlay
      ])

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
