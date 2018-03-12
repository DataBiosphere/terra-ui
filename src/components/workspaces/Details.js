import { Component, Fragment } from 'react'
import { a, div, h, h3 } from 'react-hyperscript-helpers'
import _ from 'underscore'
import * as Ajax from 'src/ajax'
import { DataTable } from 'src/components/table'
import { topBar } from 'src/components/common'
import { breadcrumb } from 'src/icons'
import * as Nav from 'src/nav'
import * as Style from 'src/style'


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
      topBar(div({ style: { display: 'flex', flexDirection: 'column', paddingLeft: '4rem' } },
        [
          a({
              style: { color: Style.colors.textFaded, cursor: 'pointer', textDecoration: 'none' },
              href: Nav.getLink('workspaces')
            },
            ['Projects', breadcrumb()]),
          div({ style: { color: Style.colors.text, fontSize: '1.25rem' } }, `${namespace}/${name}`)
        ])),
      h3({}, `${namespace}/${name}`),
      div({ style: { display: 'flex' } }, [
        div({}, entityTypeList),
        div({}, [selectedEntityType ? entityTable : 'Select an entity type.'])
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
