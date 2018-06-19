import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { contextMenu, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NotebookCreator, NotebookDeleter, NotebookDuplicator } from 'src/components/notebook-utils'
import PopupTrigger from 'src/components/PopupTrigger'
import { Buckets, Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'


class NotebookCard extends Component {
  render() {
    const { namespace, name, updated, listView, bucketName, wsName, reloadList } = this.props
    const { renamingNotebook, copyingNotebook, deletingNotebook } = this.state
    const printName = name.slice(10, -6) // removes 'notebooks/' and the .ipynb suffix

    const hideMenu = () => this.notebookMenu.close()

    const notebookMenu = h(PopupTrigger, {
      ref: instance => this.notebookMenu = instance,
      content: contextMenu([
        {
          children: 'Rename',
          onClick: () => {
            this.setState({ renamingNotebook: true })
            hideMenu()
          }
        },
        {
          children: 'Duplicate',
          onClick: () => {
            this.setState({ copyingNotebook: true })
            hideMenu()
          }
        },
        {
          children: 'Delete',
          onClick: () => {
            this.setState({ deletingNotebook: true })
            hideMenu()
          }
        }
      ])
    }, [
      h(Interactive, {
        as: 'div',
        onClick: e => e.preventDefault(),
        style: { marginLeft: '1rem', cursor: 'pointer' }, focus: 'hover'
      }, [icon('ellipsis-vertical', { size: 18 })])
    ])

    const jupyterIcon = icon('jupyterIcon', {
      style: listView ? {
        height: '2em',
        width: '2em',
        margin: '-0.5em 0.5rem -0.5em 0',
        color: Style.colors.background
      } :
        {
          height: 125,
          width: 'auto',
          color: Style.colors.background
        }
    })

    const title = div({
      title: printName,
      style: {
        ...Style.elements.cardTitle,
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'
      }
    }, printName)

    return h(Fragment, [
      a({
        target: '_blank',
        href: Nav.getLink('workspace-notebook-launch', { namespace, name: wsName, notebookName: name.slice(10) }),
        style: {
          ...Style.elements.card,
          flexShrink: 0,
          width: listView ? undefined : 200,
          height: listView ? undefined : 250,
          margin: '1.25rem',
          color: Style.colors.text, textDecoration: 'none',
          display: 'flex', flexDirection: listView ? 'row' : 'column',
          justifyContent: listView ? undefined : 'space-between',
          alignItems: listView ? 'center' : undefined
        }
      },
      listView ? [
        jupyterIcon,
        title,
        div({ style: { flexGrow: 1 } }),
        div({ style: { fontSize: '0.8rem', marginRight: '0.5rem' } },
          `Last changed: ${Utils.makePrettyDate(updated)}`),
        notebookMenu
      ] :
        [
          div({ style: { display: 'flex', justifyContent: 'space-between' } },
            [title, notebookMenu]),
          jupyterIcon,
          div({ style: { display: 'flex', alignItems: 'flex-end' } }, [
            div({ style: { fontSize: '0.8rem', flexGrow: 1, marginRight: '0.5rem' } }, [
              'Last changed:',
              div({}, Utils.makePrettyDate(updated))
            ])
          ])
        ]),
      Utils.cond(
        [
          renamingNotebook,
          () => h(NotebookDuplicator, {
            printName, namespace, bucketName, destroyOld: true,
            onDismiss: () => this.setState({ renamingNotebook: false }),
            onSuccess: () => {
              this.setState({ renamingNotebook: false })
              reloadList()
            }
          })
        ],
        [
          copyingNotebook,
          () => h(NotebookDuplicator, {
            printName, namespace, bucketName, destroyOld: false,
            onDismiss: () => this.setState({ copyingNotebook: false }),
            onSuccess: () => {
              this.setState({ copyingNotebook: false })
              reloadList()
            }
          })
        ],
        [
          deletingNotebook,
          () => h(NotebookDeleter, {
            printName, namespace, bucketName,
            onDismiss: () => this.setState({ deletingNotebook: false }),
            onSuccess: () => {
              this.setState({ deletingNotebook: false })
              reloadList()
            }
          })
        ],
        () => null)
    ])
  }
}

class WorkspaceNotebooks extends Component {
  constructor(props) {
    super(props)
    this.state = StateHistory.get()
  }

  async refresh() {
    const { namespace, name } = this.props
    try {
      this.setState({ loading: true })
      const { workspace: { bucketName } } = await Rawls.workspace(namespace, name).details()
      const notebooks = await Buckets.listNotebooks(namespace, bucketName)
      this.setState({ bucketName, notebooks: _.reverse(_.sortBy('updated', notebooks)) })
    } catch (error) {
      reportError('Error loading notebooks', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  componentWillMount() {
    this.refresh()
  }

  renderNotebooks() {
    const { bucketName, notebooks, listView } = this.state
    const { name: wsName, namespace } = this.props

    return div({ style: { display: listView ? undefined : 'flex', flexWrap: 'wrap' } },
      _.map(({ name, updated }) => h(NotebookCard, {
        name, updated, listView, bucketName, namespace, wsName,
        reloadList: () => this.refresh()
      }), notebooks)
    )
  }

  render() {
    const { loading, bucketName, notebooks, listView } = this.state
    const { namespace, name } = this.props

    return h(WorkspaceContainer,
      {
        namespace, name, refresh: () => this.refresh(),
        breadcrumbs: breadcrumbs.commonPaths.workspaceDashboard({ namespace, name }),
        title: 'Notebooks', activeTab: 'notebooks'
      },
      [
        div({ style: { padding: '1rem' } }, [
          notebooks && h(Fragment, [
            div({
              style: {
                color: Style.colors.title, display: 'flex', alignItems: 'center'
              }
            }, [
              div({ style: { fontSize: 16, fontWeight: 500 } }, 'NOTEBOOKS'),
              div({ style: { flexGrow: 1 } }),
              icon('view-cards', {
                style: {
                  cursor: 'pointer',
                  boxShadow: listView ? undefined : `0 4px 0 ${Style.colors.highlight}`,
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
              }),
              h(NotebookCreator, { reloadList: () => this.refresh(), namespace, bucketName })
            ]),
            this.renderNotebooks()
          ]),
          loading && spinnerOverlay
        ])
      ]
    )
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['bucketName', 'clusters', 'cluster', 'notebooks', 'listView'],
      this.state)
    )
  }
}

export const addNavPaths = () => {
  Nav.defPath('workspace-notebooks', {
    path: '/workspaces/:namespace/:name/notebooks',
    component: WorkspaceNotebooks
  })
}
