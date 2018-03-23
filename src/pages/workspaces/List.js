import _ from 'lodash'
import { Component, Fragment } from 'react'
import { div, h, hh } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { card, contextBar, search } from 'src/components/common'
import { breadcrumb, icon, spinner } from 'src/components/icons'
import { DataGrid } from 'src/components/table'
import { TopBar } from 'src/components/TopBar'
import * as Ajax from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import ShowOnClick from 'src/components/ShowOnClick'


const WorkspaceList = hh(class WorkspaceList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      listView: true,
      itemsPerPage: 6,
      pageNumber: 1,
      workspaces: []
    }
  }

  componentWillMount() {
    Ajax.workspaceList(
      workspaces => this.setState({ workspaces: _.sortBy(workspaces, 'workspace.name') }),
      failure => this.setState({ failure })
    )
  }

  render() {
    const { workspaces, filter, listView, itemsPerPage, pageNumber, failure } = this.state

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
          failure ?
            `Couldn't load workspace list: ${failure}` :
            spinner({ size: 64 }) :
          listView ?
            DataGrid(_.assign({
                cardsPerRow: 1,
                renderCard: ({ workspace: { namespace, name, createdBy, lastModified } }) => {
                  return h(Interactive, {
                      as: 'a',
                      interactiveChild: true,
                      nonContainedChild: true,
                      href: Nav.getLink('workspace', namespace, name),
                      hover: { backgroundColor: Style.colors.highlight },
                      focus: 'hover',
                      style: {
                        width: '100%', margin: '0.5rem', textDecoration: 'none',
                        backgroundColor: 'white'
                      }
                    },
                    [
                      card({ style: { color: Style.colors.text, display: 'flex' } }, [
                        div({
                          style: {
                            flexGrow: 1, display: 'flex', flexDirection: 'column',
                            justifyContent: 'space-between'
                          }
                        }, [
                          div({ style: Style.elements.cardTitle }, `${name}`),
                          div({
                            style: {
                              display: 'flex', justifyContent: 'space-between', width: '100%',
                              alignItems: 'flex-end', fontSize: '0.8rem'
                            }
                          }, [
                            div({ style: { flexGrow: 1 } },
                              `Billing project: ${namespace}`),
                            div({ style: { width: '35%' } },
                              [`Last changed: ${Utils.makePrettyDate(lastModified)}`])
                          ])
                        ]),
                        div({ style: { margin: '-0.25rem 0' } }, [
                          div({
                            style: { opacity: 0 }, onParentHover: { opacity: 1 },
                            onParentFocus: 'hover'
                          }, [
                            ShowOnClick({
                                style: { position: 'relative' },
                                container: div({
                                  style: {
                                    height: '1.5rem', width: '1.5rem', borderRadius: '1.5rem',
                                    lineHeight: '1.5rem', textAlign: 'center',
                                    boxShadow: Style.moreVisibleShadow, marginBottom: '0.5rem',
                                    backgroundColor: 'white'
                                  }
                                }, [icon('bars')])
                              }, [
                                div({
                                  style: {
                                    height: 20, width: 40, backgroundColor: 'blue',
                                    position: 'absolute', left: '2rem', top: '0.75rem'
                                  }
                                })
                              ]
                            )
                          ]),

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
                }
              }, dataViewerProps)
            ) :
            DataGrid(_.assign({
              renderCard: ({ workspace: { namespace, name, createdBy, lastModified } },
                           cardsPerRow) => {
                return h(Interactive, {
                    as: 'a',
                    interactiveChild: true,
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
