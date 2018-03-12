import { Component, Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import _ from 'underscore'
import { DataTable } from 'src/components/table'
import * as Ajax from 'src/libs/ajax'


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
          style: { cursor: 'pointer', margin: '0.5rem' },
          onClick: () => {
            this.setState({ selectedEntityType: k })

            Ajax.rawls(`workspaces/${namespace}/${name}/entities/${k}`).then(json =>
              this.setState({ selectedEntities: json }))
          }
        },
        `${k}s: ${v.count}`)
    )

    const entityTable = DataTable({
      dataSource: selectedEntities,
      tableProps: {
        rowKey: 'name',
        columns: !selectedEntities.length ?
          [] :
          _.map(workspaceEntities[selectedEntityType].attributeNames, function(name) {
            return {
              title: name,
              render: entity => entity.attributes[name]
            }
          })
      }
    })


    return h(Fragment, [
      div({ style: { display: 'flex' } }, [
        div({}, entityTypeList),
        div({}, [selectedEntityType ? entityTable : 'Select an entity type.'])
      ])
    ])
  }
}

export default props => h(WorkspaceData, props)
