import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinnerOverlay } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
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

    this.state = StateHistory.get()
  }

  refresh() {
    const { namespace, name } = this.props
    const { selectedEntityType } = this.state

    Rawls.workspace(namespace, name).entities().then(
      workspaceEntities => this.setState({ workspaceEntities }),
      error => reportError(`Error loading workspace entities: ${error}`)
    )

    if (selectedEntityType) {
      this.loadEntities(selectedEntityType)
    }
  }

  loadEntities(type) {
    const { namespace, name } = this.props

    Rawls.workspace(namespace, name).entity(type).then(
      selectedEntities => this.setState({ isFreshData: true, selectedEntities }),
      error => reportError(`Error loading workspace entity: ${error}`)
    )
  }

  componentWillMount() {
    this.refresh()
  }

  render() {
    const { selectedEntityType, selectedEntities, workspaceEntities, isFreshData } = this.state
    const { namespace, name } = this.props

    const entityTypeList = () => _.map(([type, typeDetails]) =>
      div({
        style: {
          cursor: 'pointer', padding: '0.75rem 1rem',
          backgroundColor: selectedEntityType === type ? Style.colors.highlightFaded : null
        },
        onClick: () => {
          this.setState({ selectedEntityType: type, selectedEntities: null })
          this.loadEntities(type)
        }
      },
      [
        icon('table', { style: { color: '#757575', marginRight: '0.5rem' } }),
        `${type} (${typeDetails.count})`
      ]),
    _.toPairs(workspaceEntities))

    const entityTable = () => h(Fragment, [
      h(DataTable, {
        defaultItemsPerPage: this.state.itemsPerPage,
        onItemsPerPageChanged: itemsPerPage => this.setState({ itemsPerPage }),
        initialPage: this.state.pageNumber,
        onPageChanged: pageNumber => this.setState({ pageNumber }),
        dataSource: _.sortBy('name', selectedEntities),
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
          }, workspaceEntities[selectedEntityType]['attributeNames']))
        }
      }),
      !isFreshData && spinnerOverlay
    ])


    return h(WorkspaceContainer,
      {
        namespace, name, refresh: () => {
          this.setState({ isFreshData: false })
          this.refresh()
        },
        breadcrumbs: breadcrumbs.commonPaths.workspaceDashboard({ namespace, name }),
        title: 'Data', activeTab: 'data'
      },
      [
        div({
          style: {
            position: 'relative',
            display: 'flex', margin: '1rem', backgroundColor: 'white', borderRadius: 5,
            boxShadow: Style.standardShadow
          }
        },
        Utils.cond(
          [!workspaceEntities, () => [centeredSpinner({ style: { margin: '2rem auto' } })]],
          [
            _.isEmpty(workspaceEntities),
            () => [div({ style: { margin: '2rem auto' } }, 'There is no data in this workspace.')]
          ],
          () => [
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
                  overflow: 'hidden', margin: `1rem ${!selectedEntities ? 'auto' : ''}`
                }
              },
              [
                Utils.cond(
                  [!selectedEntityType, 'Select a data type.'],
                  [!selectedEntities, centeredSpinner],
                  entityTable
                )
              ]
            )
          ]
        ))
      ]
    )
  }

  componentDidUpdate() {
    const { workspaceEntities, selectedEntityType, selectedEntities, itemsPerPage, pageNumber } = this.state

    StateHistory.update({ workspaceEntities, selectedEntityType, selectedEntities, itemsPerPage, pageNumber })
  }
}

export const addNavPaths = () => {
  Nav.defPath('workspace-data', {
    path: '/workspaces/:namespace/:name/data',
    component: WorkspaceData
  })
}
