import { Component } from 'react'
import { a, h } from 'react-hyperscript-helpers'
import * as Ajax from '../../ajax'
import * as Nav from '../../nav'
import DataViewer from '../DataViewer'


class WorkspaceList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pageIndex: 1,
      itemsPerPage: 25,
      filter: '',
      listView: true,
      cardWidth: 5
    }
  }

  componentWillMount() {
    Ajax.rawls('workspaces').then(json =>
      this.setState({ workspaces: json })
    )
  }

  render() {
    if (this.state.workspaces) {
      return DataViewer({
        filterFunction: ({ workspace: { namespace, name } }, filterString) =>
          `${namespace}/${name}`.includes(filterString),
        dataSource: this.state.workspaces,
        allowViewToggle: true,
        tableProps: {
          rowKey: ({ workspace }) => workspace.workspaceId,
          columns: [
            {
              title: 'Workspace', dataIndex: 'workspace', key: 'workspace',
              render: ({ namespace, name }) =>
                a({ href: Nav.getLink('workspace', namespace, name) },
                  `${namespace}/${name}`)

            }
          ]
        },
        renderCard: ({ workspace: { namespace, name } }, cardsPerRow) => {
          return a({
            style: {
              display: 'block',
              height: 100,
              width: `${100 / cardsPerRow}%`,
              border: '1px solid black',
              boxSizing: 'border-box'
            },
            href: Nav.getLink('workspace', namespace, name)
          }, `${namespace}/${name}`)
        }
      })
    } else {
      return 'Loading!'
    }
  }
}

const addNavPaths = () => {
  Nav.defRedirect({ regex: /^.{0}$/, makePath: () => 'workspaces' })
  Nav.defPath(
    'workspaces',
    {
      component: props => h(WorkspaceList, props),
      regex: /workspaces$/,
      makeProps: () => ({}),
      makePath: () => 'workspaces'
    }
  )
}

export { addNavPaths }
