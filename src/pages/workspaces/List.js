import _ from 'lodash'
import { Component, Fragment } from 'react'
import { a, div, h, hh } from 'react-hyperscript-helpers'
import { card, contextBar, link, search, TopBar } from 'src/components/common'
import { breadcrumb, icon, spinner } from 'src/components/icons'
import { DataGrid, DataTable } from 'src/components/table'
import * as Ajax from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const WorkspaceList = hh(class WorkspaceList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      listView: false,
      itemsPerPage: 6,
      pageNumber: 1,
      workspaces: []
    }
  }

  componentWillMount() {
    Ajax.rawls('workspaces').then(json =>
      this.setState({ workspaces: json })
    )
  }

  render() {
    const { workspaces, filter, listView, itemsPerPage, pageNumber } = this.state

    const dataViewerProps = {
      defaultItemsPerPage: itemsPerPage,
      itemsPerPageOptions: [6, 12, 24, 36, 48],
      onItemsPerPageChanged: n => this.setState({ itemsPerPage: n }),
      initialPage: pageNumber,
      onPageChanged: n => this.setState({ pageNumber: n }),
      dataSource: workspaces.filter(({ workspace: { namespace, name } }) =>
        `${namespace}/${name}`.includes(filter))
    }

    return h(Fragment, [
      TopBar({ title: 'Projects' },
        [
          search({
            wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
            inputProps: {
              placeholder: 'SEARCH BIOSPHERE',
              onChange: v => this.setState({ filter: v.target.value }),
              value: filter
            }
          })
        ]
      ),
      contextBar({}, [
        'PROJECTS', breadcrumb(), 'A - Z',
        div({ style: { flexGrow: 1 } }),
        icon('view-cards', {
          style: {
            cursor: 'pointer', boxShadow: listView ? null : `0 4px 0 ${Style.colors.highlight}`,
            marginRight: '1rem', width: 26, height: 22
          },
          onClick: () => {
            this.setState({ listView: false })
          }
        }),
        icon('view-list', {
          style: {
            cursor: 'pointer', boxShadow: listView ? `0 4px 0 ${Style.colors.highlight}` : null
          },
          size: 26,
          onClick: () => {
            this.setState({ listView: true })
          }
        })
      ]),
      div({ style: { margin: '1rem auto', maxWidth: 1000 } }, [
        _.isEmpty(workspaces) ?
          spinner({ size: 64 }) :
          listView ?
            DataTable(_.assign({
              tableProps: {
                rowKey: ({ workspace }) => workspace['workspaceId'],
                columns: [
                  {
                    title: 'Workspace', dataIndex: 'workspace', key: 'name',
                    render: ({ namespace, name }) =>
                      link({
                        title: name,
                        href: Nav.getLink('workspace', namespace, name),
                        style: {
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                          overflow: 'hidden', width: 400
                        }
                      }, name)
                  },
                  {
                    title: 'Billing project', dataIndex: 'workspace.namespace', key: 'namespace',
                    width: 150
                  },
                  {
                    title: 'Last changed', dataIndex: 'workspace.lastModified', key: 'lastModified',
                    width: 175,
                    render: Utils.makePrettyDate
                  },
                  {
                    title: 'Created by', dataIndex: 'workspace.createdBy', key: 'createdBy',
                    render: creator => div({
                      title: creator,
                      style: {
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                        overflow: 'hidden', width: 275
                      }
                    }, creator)
                  }
                ]
              }
            }, dataViewerProps)) :
            DataGrid(_.assign({
              renderCard: ({ workspace: { namespace, name, createdBy, lastModified } },
                           cardsPerRow) => {
                return a({
                    href: Nav.getLink('workspace', namespace, name),
                    style: {
                      width: `calc(${100 / cardsPerRow}% - 2.5rem)`, minHeight: 100,
                      margin: '1.25rem',
                      textDecoration: 'none'
                    }
                  },
                  [
                    card({ style: { height: 200 } }, [
                      div({
                        style: {
                          display: 'flex', flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%', color: Style.colors.text
                        }
                      }, [
                        div({ style: Style.elements.cardTitle }, `${name}`),
                        div({}, `Billing project: ${namespace}`),
                        div({
                          style: {
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-end', fontSize: '0.8rem'
                          }
                        }, [
                          div({}, ['Last changed:', div({}, Utils.makePrettyDate(lastModified))]),
                          div({
                            title: createdBy,
                            style: {
                              height: '1.5rem', width: '1.5rem', borderRadius: '1.5rem',
                              lineHeight: '1.5rem', textAlign: 'center',
                              backgroundColor: Style.colors.accent, color: 'white'
                            }
                          }, createdBy[0].toUpperCase())
                        ])
                      ])
                    ])
                  ])
              }
            }, dataViewerProps))
      ])
    ])
  }
})

export const addNavPaths = () => {
  Nav.defRedirect({ regex: /^.{0}$/, makePath: () => 'workspaces' })
  Nav.defPath(
    'workspaces',
    {
      component: WorkspaceList,
      regex: /workspaces$/,
      makeProps: () => ({}),
      makePath: () => 'workspaces'
    }
  )
}
