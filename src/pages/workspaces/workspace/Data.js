import _ from 'lodash'
import { div, h, table } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { icon, spinner } from 'src/components/icons'
import { DataTable } from 'src/components/table'
import { Rawls } from 'src/libs/ajax'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export default class WorkspaceData extends Component {
  componentWillMount() {
    const { namespace, name } = this.props.workspace

    Rawls.workspace(namespace, name).entities().then(
      (workspaceEntities) => this.setState({ workspaceEntities }),
      (entitiesFailure) => this.setState({ entitiesFailure })
    )
  }

  render() {
    const { namespace, name } = this.props.workspace
    const { selectedEntityType, selectedEntities, workspaceEntities, entitiesFailure, entityFailure } = this.state

    const entityTypeList = () => _.map(workspaceEntities, (typeDetails, type) =>
      div({
        style: {
          cursor: 'pointer', padding: '0.75rem 1rem',
          backgroundColor: selectedEntityType === type ? Style.colors.highlightFaded : null
        },
        onClick: () => {
          this.setState({ selectedEntityType: type, selectedEntities: null })
          Rawls.workspace(namespace, name).entity(type).then(
            (selectedEntities) => this.setState({ selectedEntities }),
            (entityFailure) => this.setState({ entityFailure })
          )
        }
      },
      [
        icon('table', { style: { color: '#757575', marginRight: '0.5rem' } }),
        `${type} (${typeDetails.count})`
      ])
    )

    const entityTable = () => h(DataTable, {
      dataSource: _.sortBy(selectedEntities, 'name'),
      tableProps: {
        rowKey: 'name',
        scroll: { x: true },
        components: {
          table: (props) => table(_.merge({ style: { borderCollapse: 'collapse' } }, props)),
          body: {
            row: (props) => h(Interactive,
              _.merge({
                as: 'tr', style: { cursor: null },
                hover: { backgroundColor: Style.colors.highlightFaded }
              },
              props)
            )
          }
        },
        columns: _.map(workspaceEntities[selectedEntityType]['attributeNames'], function(name) {
          return {
            title: name,
            key: name,
            render: (entity) => div({ style: { padding: '0.5rem' } }, entity.attributes[name])
          }
        })
      }
    })


    return div({
      style: {
        display: 'flex', margin: '1rem', backgroundColor: 'white', borderRadius: 5,
        boxShadow: Style.standardShadow
      }
    },
    Utils.cond(
      [entitiesFailure, () => `Couldn't load workspace entities: ${entitiesFailure}`],
      [!workspaceEntities, () => [spinner({ style: { margin: '2rem auto' } })]],
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
              [entityFailure, () => `Couldn't load ${selectedEntityType}s: ${entityFailure}`],
              [!selectedEntityType, 'Select a data type.'],
              [!selectedEntities, spinner],
              entityTable
            )
          ]
        )
      ]
    ))
  }
}
