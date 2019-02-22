import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { link, PageBox, search, spinnerOverlay } from 'src/components/common'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { styles } from 'src/pages/groups/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { FlexTable, HeaderCell } from 'src/components/table'
import { AutoSizer } from 'react-virtualized'

const BillingCard = pure(({ billingProject: { projectName, role, creationStatus } }) => {
  return div({
    style: styles.longCard
  }, [
    h(TooltipTrigger, {
      content: creationStatus
    }, [
      icon((creationStatus === 'Ready') ? 'check' : 'bars', {
        style: {
          color: creationStatus === 'Ready' ? colors.green[0] : undefined,
          marginRight: '2rem'
        }
      })
    ]),
    a({
      style: {
        marginRight: '1rem',
        width: '30%',
        color: undefined,
        ...styles.longTitle
      }
    }, [projectName]),
    div({ style: { width: 100, display: 'flex', alignItems: 'center' } }, [
      div({ style: { flexGrow: 1, textTransform: 'capitalize' } }, [_.join(', ', role)])
    ])
  ])
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
    this.refresh()
  }

  render() {
    const { billingProjects, isDataLoaded, filter, updating } = this.state
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
        div({ style: styles.toolbarContainer }, [
          div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, [
            'Billing Management'
          ])
        ]),
        div({ style: styles.cardContainer }, [
          div({ style: { flexGrow: 1 } }, [
            _.flow(
              _.filter(({ projectName }) => Utils.textMatch(filter, projectName)),
              _.map(billingProject => {
                return h(BillingCard, {
                  billingProject, key: `${billingProject.projectName}`
                })
              })
            )(billingProjects)
          ]),
          !isDataLoaded && spinnerOverlay
        ]),
        h(AutoSizer, [
          ({ width, height }) => h(FlexTable, {
            width,
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
                  return h(Fragment, [
                    icon((billingProjects[rowIndex].creationStatus === 'Ready') ? 'check' : 'bars', {
                      style: {
                        color: billingProjects[rowIndex].creationStatus === 'Ready' ? colors.green[0] : undefined,
                        marginRight: '1rem'
                      }
                    }),
                    billingProjects[rowIndex].creationStatus
                  ])
                }
              },
              {
                size: {
                  basis: 200,
                  grow: 0
                },
                headerRenderer: () => h(HeaderCell, ['Project Name']),
                cellRenderer: ({ rowIndex }) => {return billingProjects[rowIndex].projectName}
              },
              {
                size: { basis: 150, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Role']),
                cellRenderer: ({ rowIndex }) => {return billingProjects[rowIndex].role}
              }
            ]
          })
        ]),
        updating && spinnerOverlay
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
    title: 'Billing Projects'
  })
}
