import mixinDeep from 'mixin-deep'
import { Component } from 'react'
import { div, h, table } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import _ from 'underscore'
import { icon } from 'src/components/icons'
import { DataTable } from 'src/components/table'
import * as Ajax from 'src/libs/ajax'
import * as Style from 'src/libs/style'


class WorkspaceData extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedEntityType: '',
      selectedEntities: []
    }
  }

  render() {
    const { namespace, name, workspaceEntities } = this.props
    const { selectedEntityType, selectedEntities } = this.state

    const entityTypeList = _.map(workspaceEntities, (v, k) =>
      div({
          style: {
            cursor: 'pointer', padding: '0.75rem 1rem',
            backgroundColor: selectedEntityType === k ? Style.colors.highlightFaded : null
          },
          onClick: () => {
            this.setState({ selectedEntityType: k, selectedEntities: [] })

            Ajax.rawls(`workspaces/${namespace}/${name}/entities/${k}`).then(json =>
              this.setState({ selectedEntities: json }))
          }
        },
        [
          icon('table', { style: { color: '#757575', marginRight: '0.5rem' } }),
          `${k} (${v.count})`
        ])
    )

    const entityTable = DataTable({
      dataSource: selectedEntities,
      tableProps: {
        rowKey: 'name',
        scroll: { x: true },
        components: {
          table: props => table(mixinDeep({ style: { borderCollapse: 'collapse' } }, props)),
          body: {
            row: props => h(Interactive,
              mixinDeep({
                  as: 'tr', style: { cursor: 'unset' },
                  hover: { backgroundColor: Style.colors.highlightFaded }
                },
                props))
          }
        },
        columns: !selectedEntities.length ?
          [] :
          _.map(workspaceEntities[selectedEntityType].attributeNames, function(name) {
            return {
              title: name,
              key: name,
              render: entity => div({ style: { padding: '0.5rem' } }, entity.attributes[name])
            }
          })
      }
    })


    return div({
      style: {
        display: 'flex', margin: '1rem', backgroundColor: 'white', borderRadius: 5,
        boxShadow: Style.standardShadow
      }
    }, [
      div({ style: { flexShrink: 0, borderRight: `1px solid ${Style.colors.disabled}` } }, [
        div({
          style: {
            fontWeight: 500, padding: '0.5rem 1rem',
            borderBottom: `1px solid ${Style.colors.background}`
          }
        }, 'Entity Types'),
        div({ style: { marginBottom: '1rem' } }, entityTypeList)
      ]),
      div({ style: { overflowX: 'auto', margin: '1rem' } }, [
        selectedEntityType ?
          _.isEmpty(selectedEntities) ? 'Loading...' : entityTable :
          'Select an entity type.'
      ])
    ])
  }
}

export default props => h(WorkspaceData, props)
