import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { DataTable } from 'src/components/table'
import { Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'


class WorkspaceData extends Component {
  constructor(props) {
    super(props)

    this.state = _.merge({
      itemsPerPage: 25, pageNumber: 1
    }, StateHistory.get())
  }

  refresh() {
    const { namespace, name } = this.props
    const { selectedEntityType } = this.state

    Rawls.workspace(namespace, name).entityMetadata().then(
      entityMetadata => this.setState({ entityMetadata }),
      error => reportError('Error loading workspace entities', error)
    )

    if (selectedEntityType) {
      this.loadEntities(selectedEntityType)
    }
  }

  loadEntities(type = this.state.selectedEntityType) {
    const { namespace, name } = this.props
    const { itemsPerPage, pageNumber } = this.state

    this.setState({ selectedEntities: undefined })
    Rawls.workspace(namespace, name).paginatedEntitiesOfType(type, { page: pageNumber, pageSize: itemsPerPage }).then(
      ({ results, resultMetadata: { unfilteredCount } }) => this.setState({
        selectedEntities: results,
        totalRowCount: unfilteredCount
      }),
      error => reportError('Error loading workspace entity', error)
    )
  }

  componentWillMount() {
    this.refresh()
  }

  render() {
    const { selectedEntityType, selectedEntities, entityMetadata, totalRowCount } = this.state
    const { namespace, name } = this.props

    const entityTypeList = () => _.map(([type, typeDetails]) =>
      div({
        style: {
          cursor: 'pointer', padding: '0.75rem 1rem',
          backgroundColor: selectedEntityType === type ? Style.colors.highlightFaded : null
        },
        onClick: () => {
          this.setState({ selectedEntityType: type })
          this.loadEntities(type)
        }
      },
      [
        icon('table', { style: { color: '#757575', marginRight: '0.5rem' } }),
        `${type} (${typeDetails.count})`
      ]),
    _.toPairs(entityMetadata))

    const entityTable = () => h(Fragment, [
      selectedEntities ? h(DataTable, {
        defaultItemsPerPage: this.state.itemsPerPage,
        onItemsPerPageChanged: itemsPerPage => this.setState({ itemsPerPage }),
        initialPage: this.state.pageNumber,
        onPageChanged: pageNumber => this.setState({ pageNumber }),
        totalRowCount,
        dataSource: selectedEntities,
        tableProps: {
          rowKey: 'name',
          scroll: { x: true },
          columns: _.concat([
            {
              title: selectedEntityType + '_id',
              key: selectedEntityType + '_id',
              render: entity => entity.name
            }
          ], _.map(name => {
            return {
              title: name,
              key: name,
              render: entity => entity.attributes[name]
            }
          }, entityMetadata[selectedEntityType]['attributeNames']))
        }
      }) : spinnerOverlay
    ])


    return h(WorkspaceContainer,
      {
        namespace, name,
        refresh: () => this.refresh(),
        breadcrumbs: breadcrumbs.commonPaths.workspaceDashboard({ namespace, name }),
        title: 'Data', activeTab: 'data'
      },
      [
        div({
          style: {
            display: 'flex', margin: '1rem', backgroundColor: 'white', borderRadius: 5,
            boxShadow: Style.standardShadow
          }
        },
        [
          Utils.cond(
            [!entityMetadata, () => spinnerOverlay],
            [
              _.isEmpty(entityMetadata),
              () => div({ style: { margin: '2rem auto' } }, 'There is no data in this workspace.')
            ],
            () => h(Fragment, [
              div({ style: { flexShrink: 0, borderRight: `1px solid ${Style.colors.disabled}` } }, [
                div({
                  style: {
                    fontWeight: 500, padding: '0.5rem 1rem',
                    borderBottom: `1px solid ${Style.colors.background}`
                  }
                }, 'Data Model'),
                div({ style: { marginBottom: '1rem' } }, entityTypeList())
              ]),
              div(
                {
                  style: {
                    position: 'relative',
                    overflow: 'hidden',
                    margin: '1rem', width: '100%',
                    textAlign: selectedEntityType ? undefined : 'center'
                  }
                },
                [selectedEntityType ? entityTable() : 'Select a data type.']
              )
            ])
          )
        ])
      ]
    )
  }

  componentDidUpdate(prevProps, prevState) {
    StateHistory.update(_.pick(
      ['entityMetadata', 'selectedEntityType', 'selectedEntities', 'itemsPerPage', 'pageNumber'],
      this.state)
    )

    if (this.state.itemsPerPage !== prevState.itemsPerPage || this.state.pageNumber !== prevState.pageNumber) {
      this.loadEntities()
    }
  }
}

export const addNavPaths = () => {
  Nav.defPath('workspace-data', {
    path: '/workspaces/:namespace/:name/data',
    component: WorkspaceData
  })
}
