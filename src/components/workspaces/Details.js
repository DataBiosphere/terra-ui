import Table from 'rc-table'
import { Component, Fragment } from 'react'
import { div, h, h3 } from 'react-hyperscript-helpers'
import _ from 'underscore'
import * as Ajax from '../../ajax'
import * as Nav from '../../nav'


class WorkspaceDetails extends Component {
  constructor(props) {
    super(props)
    this.state = {
      workspaceEntities: {},
      selectedEntityType: '',
      selectedEntities: []
    }
  }

  componentWillMount() {
    const { namespace, name } = this.props

    Ajax.rawls(`workspaces/${namespace}/${name}`).then(json =>
      this.setState({ workspace: json })
    )

    Ajax.rawls(`workspaces/${namespace}/${name}/entities`).then(json =>
      this.setState({ workspaceEntities: json })
    )

  }

  render() {
    const { namespace, name } = this.props
    const { workspaceEntities, selectedEntityType, selectedEntities } = this.state

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

    const entityTable = h(Table,
      {
        data: selectedEntities,
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
    )


    return h(Fragment, [
      h3({}, `${namespace}/${name}`),
      div({ style: { display: 'flex' } }, [
        div({}, entityTypeList),
        div({}, selectedEntityType ? [entityTable] : 'Select an entity type.')
      ])
    ])
  }
}


const addNavPaths = () => {
  Nav.defPath(
    'workspace',
    {
      component: props => h(WorkspaceDetails, props),
      regex: /workspaces\/([^/]+)\/([^/]+)/,
      makeProps: (namespace, name) => ({ namespace, name }),
      makePath: (namespace, name) => `workspaces/${namespace}/${name}`
    }
  )
}

export { addNavPaths }
