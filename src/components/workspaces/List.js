import Table from 'rc-table'
import { Component, Fragment } from 'react'
import { a, div, h, input, option, select } from 'react-hyperscript-helpers'
import _ from 'underscore'
import { ajax } from '../../ajax'
import * as Nav from '../../nav'


class WorkspaceList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pageIndex: 1,
      itemsPerPage: 25,
      filter: ''
    }
  }

  componentWillMount = () => {
    ajax('https://rawls.dsde-dev.broadinstitute.org/api/workspaces').then(json =>
      this.setState({ workspaces: json })
    )
  }

  render() {
    if (this.state.workspaces) {
      const filteredWorkspaces = this.state.workspaces.filter(
        ({ workspace: { namespace, name } }) => `${namespace}/${name}`.includes(this.state.filter))
      const listPage = filteredWorkspaces.slice((this.state.pageIndex - 1) *
        this.state.itemsPerPage,
        this.state.pageIndex * this.state.itemsPerPage)

      return h(Fragment, [
        input({
          placeholder: 'Filter',
          onChange: e => this.setState({ filter: e.target.value })
        }),
        h(Table,
          {
            data: listPage,
            rowKey: ({ workspace }) => workspace.workspaceId,
            columns: [
              {
                title: 'Workspace', dataIndex: 'workspace', key: 'workspace',
                render: ({ namespace, name }) => {
                  return a({ href: `workspaces/${namespace}/${name}` },
                    `${namespace}/${name}`)
                }
              }
            ]
          }
        ),
        div({ style: { marginTop: 10 } }, [
          'Page: ',
          select({
              style: { marginRight: '1rem' },
              onChange: e => this.setState({ pageIndex: parseInt(e.target.value, 10) }),
              value: this.state.pageIndex
            },
            _.map(_.range(1, filteredWorkspaces.length / this.state.itemsPerPage + 1),
              i => option({}, i))),
          'Items per page: ',
          select({
              onChange: e => this.setState({ itemsPerPage: parseInt(e.target.value, 10) }),
              value: this.state.itemsPerPage
            },
            _.map([10, 25, 50, 100],
              i => option({}, i)))
        ])
      ])
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
      makeProps: () => {},
      makePath: () => 'workspaces'
    }
  )
}

export { addNavPaths }
