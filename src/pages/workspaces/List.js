import _ from 'lodash'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { connect } from 'react-redux'
import { contextBar, search } from 'src/components/common'
import { breadcrumb, icon, spinner } from 'src/components/icons'
import { DataGrid } from 'src/components/table'
import { TopBar } from 'src/components/TopBar'
import { Rawls } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'

const wsAccessible = ws => {
  return !ws.public || Utils.workspaceAccessLevels.indexOf(ws.accessLevel) > Utils.workspaceAccessLevels.indexOf('READER')
}

const filterWorkspaces = workspaces => {
  return _.sortBy(_.filter(workspaces, wsAccessible), 'workspace.name')
}

export const WorkspaceList = _.flowRight(
  connect(state => {
    const { workspaces: { filter, listView, itemsPerPage, pageNumber, workspaces, failure } } = state
    return { filter, listView, itemsPerPage, pageNumber, workspaces, failure }
  }, {
    setFilter: filter => state => {
      return state.mergeIn(['workspaces'], { filter })
    },
    setListView: listView => state => {
      return state.mergeIn(['workspaces'], { listView })
    },
    setItemsPerPage: itemsPerPage => state => {
      return state.mergeIn(['workspaces'], { itemsPerPage })
    },
    setPageNumber: pageNumber => state => {
      return state.mergeIn(['workspaces'], { pageNumber })
    },
    loadWorkspaces: () => Utils.thunk(dispatch => {
      Rawls.workspacesList().then(
        workspaces => {
          dispatch(state => {
            return state.setIn(['workspaces', 'workspaces'], filterWorkspaces(workspaces))
          })
        },
        failure => {
          dispatch(state => {
            return state.mergeIn(['workspaces'], { failure })
          })
        }
      )
    }),
  })
)(class extends Component {
  componentWillMount() {
    const { loadWorkspaces } = this.props
    loadWorkspaces()
  }

  getDataViewerProps() {
    const { workspaces, itemsPerPage, pageNumber, filter, setItemsPerPage, setPageNumber } = this.props
    return {
      defaultItemsPerPage: itemsPerPage,
      itemsPerPageOptions: [6, 12, 24, 36, 48],
      onItemsPerPageChanged: setItemsPerPage,
      initialPage: pageNumber,
      onPageChanged: setPageNumber,
      dataSource: workspaces.filter(({ workspace: { namespace, name } }) =>
        `${namespace}/${name}`.includes(filter))
    }
  }

  wsList() {
    return h(DataGrid, _.assign({
        cardsPerRow: 1,
        renderCard: ({ workspace: { namespace, name, createdBy, lastModified } }) => {
          return a({
              href: Nav.getLink('workspace', namespace, name),
              style: _.defaults({
                width: '100%', margin: '0.5rem', textDecoration: 'none',
                backgroundColor: 'white', color: Style.colors.text
              }, Style.elements.card)
            },
            [
              div({ style: Style.elements.cardTitle }, `${name}`),
              div({ style: { display: 'flex', alignItems: 'flex-end', fontSize: '0.8rem' } },
                [
                  div({ style: { flexGrow: 1 } },
                    `Billing project: ${namespace}`),
                  div({ style: { width: '35%' } },
                    [`Last changed: ${Utils.makePrettyDate(lastModified)}`]),
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
    return h(DataGrid, _.assign({
      renderCard: ({ workspace: { namespace, name, createdBy, lastModified } },
                   cardsPerRow) => {
        return a({
            href: Nav.getLink('workspace', namespace, name),
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
      }
    }, this.getDataViewerProps()))
  }


  render() {
    const { workspaces, failure, filter, listView, setFilter, setListView } = this.props

    return h(Fragment, [
      h(TopBar, { title: 'Projects' },
        [
          search({
            wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
            inputProps: {
              placeholder: 'SEARCH BIOSPHERE',
              onChange: v => setFilter(v.target.value),
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
          onClick: () => setListView(false)
        }),
        icon('view-list', {
          style: {
            cursor: 'pointer', boxShadow: listView ? `0 4px 0 ${Style.colors.highlight}` : null
          },
          size: 26,
          onClick: () => setListView(true)
        })
      ]),
      div({ style: { margin: '1rem auto', maxWidth: 1000 } }, [
        Utils.cond(
          [failure, () => `Couldn't load workspace list: ${failure}`],
          [!workspaces, () => spinner({ size: 64 })],
          [_.isEmpty(workspaces), 'You don\'t seem to have access to any workspaces.'],
          [listView, () => this.wsList()],
          () => this.wsGrid()
        )
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
