import _ from 'lodash'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { contextBar, search } from 'src/components/common'
import { breadcrumb, icon, spinner } from 'src/components/icons'
import { DataGrid } from 'src/components/table'
import { TopBar } from 'src/components/TopBar'
import { Rawls } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
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
      workspaces: null
    }
  }

  componentWillMount() {
    Rawls.workspacesList().then(
      (workspaces) => this.setState({
        workspaces: _.sortBy(_.filter(workspaces,
          (ws) => !ws.public || Utils.workspaceAccessLevels.indexOf(ws.accessLevel) >
            Utils.workspaceAccessLevels.indexOf('READER')),
        'workspace.name')
      }),
      (failure) => this.setState({ failure })
    )
  }

  getDataViewerProps() {
    return {
      defaultItemsPerPage: this.state.itemsPerPage,
      itemsPerPageOptions: [6, 12, 24, 36, 48],
      onItemsPerPageChanged: (n) => this.setState({ itemsPerPage: n }),
      initialPage: this.state.pageNumber,
      onPageChanged: (n) => this.setState({ pageNumber: n }),
      dataSource: this.state.workspaces.filter(({ workspace: { namespace, name } }) =>
        `${namespace}/${name}`.includes(this.state.filter))
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
    }, this.getDataViewerProps()))
  }

  wsGrid() {
    return h(DataGrid, _.assign({
      renderCard: ({ workspace: { namespace, name, createdBy, lastModified } },
        cardsPerRow) => {
        return a({
          href: Nav.getLink('workspace', namespace, name),
          style: _.defaults({
            width: `calc(${100 / cardsPerRow}% - 2.5rem)`,
            margin: '1.25rem',
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
    const { workspaces, filter, listView, failure } = this.state

    return h(Fragment, [
      h(TopBar, { title: 'Projects' },
        [
          search({
            wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
            inputProps: {
              placeholder: 'SEARCH BIOSPHERE',
              onChange: (e) => this.setState({ filter: e.target.value }),
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
}

export const addNavPaths = () => {
  Nav.defRedirect({ regex: /^.{0}$/, makePath: () => 'workspaces' })
  Nav.defPath(
    'workspaces',
    {
      regex: /workspaces$/,
      render: () => h(WorkspaceList),
      makePath: () => 'workspaces'
    }
  )
}
