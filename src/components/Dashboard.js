import Table from 'rc-table'
import { Component, Fragment } from 'react'
import { div, h, option, select } from 'react-hyperscript-helpers'
import _ from 'underscore'
import { ajax } from '../ajax'
import * as Nav from '../nav'


class WorkspaceList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pageIndex: 1,
      itemsPerPage: 25,
      workspaces: []
    }
  }

  componentWillMount = () => {
    ajax('https://rawls501.dsde-dev.broadinstitute.org/api/workspaces').then(json =>
      this.setState({ workspaces: json })
    )
  }

  render() {
    return h(Fragment, [
      h(Table,
        {
          data: this.state.workspaces.slice((this.state.pageIndex - 1) * this.state.itemsPerPage,
            this.state.pageIndex * this.state.itemsPerPage),
          rowKey: 'workspace.workspaceId',
          columns: [
            {
              title: 'Workspace', dataIndex: 'workspace', key: 'workspace',
              render: ({ namespace, name }) => `${namespace}/${name}`
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
          _.map(_.range(1, this.state.workspaces.length / this.state.itemsPerPage + 1),
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
  }
}

const addNavPaths = () => {
  Nav.defRedirect({ regex: /^.{0}$/, makePath: () => 'dashboard' })
  Nav.defPath(
    'dashboard',
    {
      component: props => h(WorkspaceList, props),
      regex: /dashboard/,
      makeProps: () => {},
      makePath: () => 'dashboard'
    }
  )
}

export { addNavPaths }
