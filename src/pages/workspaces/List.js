import _ from 'lodash'
import { Component, Fragment } from 'react'
import { div, h, hh } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { contextBar, contextMenu, search } from 'src/components/common'
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
      listView: false,
      itemsPerPage: 6,
      pageNumber: 1,
      workspaces: []
    }
  }

  componentWillMount() {
    Ajax.workspacesList(
      workspaces => this.setState({ workspaces: _.sortBy(workspaces, 'workspace.name') }),
      failure => this.setState({ failure })
    )
  }

  menuButton(namespace, name) {
    return ShowOnClick({
        containerProps: { style: { position: 'relative' } },
        button: div({
          style: {
            height: '1.5rem', width: '1.5rem', borderRadius: '1.5rem', lineHeight: '1.5rem',
            textAlign: 'center', backgroundColor: 'white',
            boxShadow: Style.contextMenuShadow, marginBottom: '0.5rem'
          }
        }, [icon('bars')])
      },
      [
        div({ style: { position: 'absolute', left: '2rem', top: '0.75rem' } }, [
          contextMenu([
            [{ onClick: () => Nav.goToPath('workspace', namespace, name) }, 'Open'],
            [{}, 'Clone'],
            [{}, 'Rename'],
            [{}, 'Share'],
            [{}, 'Publish'],
            [{}, 'Delete']
          ])
        ])
      ]
    )

  }

  getDataViewerProps() {
    return {
      defaultItemsPerPage: this.state.itemsPerPage,
      itemsPerPageOptions: [6, 12, 24, 36, 48],
      onItemsPerPageChanged: n => this.setState({ itemsPerPage: n }),
      initialPage: this.state.pageNumber,
      onPageChanged: n => this.setState({ pageNumber: n }),
      dataSource: this.state.workspaces.filter(({ workspace: { namespace, name } }) =>
        `${namespace}/${name}`.includes(this.state.filter))
    }
  }

  wsList() {
    return DataGrid(_.assign({
        cardsPerRow: 1,
        renderCard: ({ workspace: { namespace, name, createdBy, lastModified } }) => {
          return h(Interactive, {
              as: 'a',
              interactiveChild: true,
              nonContainedChild: true,
              href: Nav.getLink('workspace', namespace, name),
              hover: { backgroundColor: Style.colors.highlight },
              style: _.defaults({
                width: '100%', margin: '0.5rem', textDecoration: 'none',
                backgroundColor: 'white', color: Style.colors.text, display: 'flex'
              }, Style.elements.card)
            },
            [
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
                  style: { opacity: 0 }, onParentHover: { opacity: 1 }
                }, [this.menuButton(namespace, name)]),
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
        }
      }, this.getDataViewerProps())
    )
  }

  wsGrid() {
    return DataGrid(_.assign({
      renderCard: ({ workspace: { namespace, name, createdBy, lastModified } },
                   cardsPerRow) => {
        return h(Interactive, {
            as: 'a',
            interactiveChild: true,
            nonContainedChild: true,
            href: Nav.getLink('workspace', namespace, name),
            hover: { backgroundColor: Style.colors.highlight },
            style: _.defaults({
              width: `calc(${100 / cardsPerRow}% - 2.5rem)`,
              margin: '1.25rem', boxSizing: 'border-box',
              textDecoration: 'none',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between',
              height: 225, color: Style.colors.text
            }, Style.elements.card)
          },
          [
            div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
              div({
                style: _.defaults({ width: 'calc(100% - 2rem)', wordWrap: 'break-word' },
                  Style.elements.cardTitle)
              }, `${name}`),
              div({
                style: { opacity: 0 }, onParentHover: { opacity: 1 }
              }, [this.menuButton(namespace, name)])
            ]),
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
      }
    }, this.getDataViewerProps()))
  }


  render() {
    const { workspaces, filter, listView, failure } = this.state

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
            this.wsList() : this.wsGrid()
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
