import update from 'immutability-helper'
import Table from 'rc-table'
import { Component, Fragment } from 'react'
import { a, button, div, h, input, option, select } from 'react-hyperscript-helpers'
import _ from 'underscore'
import { ajax } from '../../ajax'
import * as Nav from '../../nav'


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

      const renderWorkspaceList = () => {
        return h(Table,
          {
            data: listPage,
            rowKey: ({ workspace }) => workspace.workspaceId,
            columns: [
              {
                title: 'Workspace', dataIndex: 'workspace', key: 'workspace',
                render: ({ namespace, name }) => {
                  return a({ href: Nav.getLink('workspace', namespace, name) },
                    `${namespace}/${name}`)
                }
              }
            ]
          }
        )
      }

      const renderWorkspaceCards = () => {
        return h(Fragment,
          [
            button(
              {
                onClick: () => this.setState(
                  prev => (update(prev, { cardWidth: { $apply: n => n + 1 } })))
              },
              '+'),
            button(
              {
                onClick: () => this.setState(
                  prev => (update(prev, { cardWidth: { $apply: n => _.max([n - 1, 1]) } })))
              },
              '-'),
            div({ style: { display: 'flex', flexWrap: 'wrap' } },
              _.map(listPage, ({ workspace: { namespace, name } }) => {
                return a({
                  style: {
                    display: 'block',
                    height: 100,
                    width: `${100 / this.state.cardWidth}%`,
                    border: '1px solid black',
                    boxSizing: 'border-box'
                  },
                  href: Nav.getLink('workspace', namespace, name)
                }, `${namespace}/${name}`)
              })
            )
          ]
        )
      }

      return h(Fragment, [
        input({
          placeholder: 'Filter',
          onChange: e => this.setState({ filter: e.target.value })
        }),
        button({ onClick: () => this.setState(prev => (update(prev, { $toggle: ['listView'] }))) },
          'Toggle display mode'),
        this.state.listView ? renderWorkspaceList() : renderWorkspaceCards(),
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
