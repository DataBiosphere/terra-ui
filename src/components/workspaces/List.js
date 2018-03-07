import update from 'immutability-helper'
import { Component, Fragment } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import * as Ajax from 'src/ajax'
import { card, contextBar, link, search, topBar } from 'src/components/common'
import DataViewer from 'src/components/DataViewer'
import { icon } from 'src/icons'
import * as Nav from 'src/nav'
import * as Style from 'src/style'


class WorkspaceList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      listView: false
    }
  }

  componentWillMount() {
    Ajax.rawls('workspaces').then(json =>
      this.setState({ workspaces: json })
    )
  }

  render() {
    const { workspaces, filter, listView } = this.state

    return h(Fragment, [
      topBar(
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH BIOSPHERE',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ),
      contextBar({}, [
        span({}, 'PROJECTS > A - Z'),
        div({ style: { flexGrow: 1 } }),
        icon('grid-view', {
          style: {
            cursor: 'pointer', boxShadow: listView ? null : `0 4px 0 ${Style.colors.highlight}`,
            marginRight: '1rem', width: 26, height: 22
          },
          onClick: () => {
            this.viewer.setViewMode('card')
            this.setState({ listView: false })
          }
        }),
        icon('view-list', {
          style: {
            cursor: 'pointer', boxShadow: listView ? `0 4px 0 ${Style.colors.highlight}` : null
          },
          size: 26,
          onClick: () => {
            this.viewer.setViewMode('list')
            this.setState({ listView: true })
          }
        })
      ]),
      div({ style: { margin: '0 auto', maxWidth: 1000 } }, [
        workspaces ?
          DataViewer({
            ref: r => {this.viewer = r},
            allowFilter: false,
            defaultItemsPerPage: 10,
            dataSource: workspaces.filter(({ workspace: { namespace, name } }) =>
              `${namespace}/${name}`.includes(filter)),
            defaultViewMode: 'card',
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
            renderCard: ({ workspace: { namespace, name, createdBy } }, cardsPerRow) => {
              return a({
                  href: Nav.getLink('workspace', namespace, name),
                  style: {
                    width: `calc(${100 / cardsPerRow}% - 4rem)`, margin: '2rem',
                    textDecoration: 'none'
                  }
                },
                [
                  card({ style: { height: 100, width: '100%' } }, [
                    div({
                      style: {
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        height: '100%'
                      }
                    }, [
                      div({
                        style: update(Style.elements.cardTitle,
                          { $merge: { wordWrap: 'break-word' } })
                      }, `${namespace}/${name}`),
                      div({ style: { color: Style.colors.text } }, `Created by: ${createdBy}`)
                    ])
                  ])
                ]
              )
            },
            defaultCardsPerRow: 3
          }) :
          'Loading!'
      ])
    ])
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
