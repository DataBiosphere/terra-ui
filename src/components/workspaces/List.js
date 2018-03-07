import { Component } from 'react'
import { h } from 'react-hyperscript-helpers'
import * as Ajax from 'src/ajax'
import { card, link } from 'src/components/common'
import DataViewer from 'src/components/DataViewer'
import * as Nav from 'src/nav'


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
                link({ href: Nav.getLink('workspace', namespace, name) },
                  `${namespace}/${name}`)

            }
          ]
        },
        renderCard: ({ workspace: { namespace, name } }, cardsPerRow) => {
          return link({
              href: Nav.getLink('workspace', namespace, name),
              style: { width: `${100 / cardsPerRow}%` }
            },
            [
              card({
                style: {
                  height: 100,
                  width: '100%',
                  boxSizing: 'border-box'
                }
              }, `${namespace}/${name}`)
            ])
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
