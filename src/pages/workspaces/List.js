import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { contextBar, search, spinnerOverlay } from 'src/components/common'
import { breadcrumb, icon } from 'src/components/icons'
import { DataGrid } from 'src/components/table'
import { TopBar } from 'src/components/TopBar'
import { Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export class WorkspaceList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      listView: false,
      itemsPerPage: 6,
      pageNumber: 1,
      workspaces: null,
      ...StateHistory.get()
    }
  }

  getDataViewerProps() {
    return {
      itemsPerPageOptions: [6, 12, 24, 36, 48],
      itemsPerPage: this.state.itemsPerPage,
      onItemsPerPageChanged: n => this.setState({ itemsPerPage: n }),
      pageNumber: this.state.pageNumber,
      onPageChanged: n => this.setState({ pageNumber: n }),
      dataSource: this.state.workspaces.filter(({ workspace: { namespace, name } }) =>
        `${namespace}/${name}`.includes(this.state.filter))
    }
  }

  wsList() {
    return h(DataGrid, {
      cardsPerRow: 1,
      renderCard: ({ workspace: { namespace, name, createdBy, lastModified } }) => {
        return a({
          href: Nav.getLink('workspace', { namespace, name }),
          style: {
            ...Style.elements.card,
            width: '100%', margin: '0.5rem', textDecoration: 'none',
            color: Style.colors.text
          }
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
      },
      ...this.getDataViewerProps()
    })
  }

  wsGrid() {
    return h(DataGrid, {
      renderCard: ({ workspace: { namespace, name, createdBy, lastModified } }, cardsPerRow) => {
        return a({
          href: Nav.getLink('workspace', { namespace, name }),
          style: {
            ...Style.elements.card,
            width: `calc(${100 / cardsPerRow}% - 2.5rem)`,
            margin: '1.25rem',
            textDecoration: 'none',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between',
            height: 225, color: Style.colors.text
          }
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
      },
      ...this.getDataViewerProps()
    })
  }


  render() {
    const { workspaces, isDataLoaded, filter, listView } = this.state

    return h(Fragment, [
      h(TopBar, { title: 'Projects' },
        [
          search({
            wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
            inputProps: {
              placeholder: 'SEARCH BIOSPHERE',
              onChange: e => this.setState({ filter: e.target.value, pageNumber: 1 }),
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
      div({ style: { width: '100%', position: 'relative', padding: '1rem', flexGrow: 1 } }, [
        workspaces && div({ style: { margin: 'auto', maxWidth: 1000 } }, [
          Utils.cond(
            [_.isEmpty(workspaces), 'You don\'t seem to have access to any workspaces.'],
            [listView, () => this.wsList()],
            () => this.wsGrid()
          )
        ]),
        !isDataLoaded && spinnerOverlay
      ])
    ])
  }

  componentDidMount() {
    Rawls.workspacesList().then(
      workspaces => this.setState({
        isDataLoaded: true,
        workspaces: _.sortBy('workspace.name', _.filter(ws => !ws.public ||
          Utils.workspaceAccessLevels.indexOf(ws.accessLevel) > Utils.workspaceAccessLevels.indexOf('READER'),
        workspaces))
      }),
      error => reportError(`Error loading workspace list: ${error}`)
    )
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['workspaces', 'filter', 'listView', 'itemsPerPage', 'pageNumber'],
      this.state)
    )
  }
}

export const addNavPaths = () => {
  Nav.defPath('root', {
    path: '/',
    component: () => h(Nav.Redirector, { pathname: '/workspaces' })
  })
  Nav.defPath('workspaces', {
    path: '/workspaces',
    component: WorkspaceList
  })
}
