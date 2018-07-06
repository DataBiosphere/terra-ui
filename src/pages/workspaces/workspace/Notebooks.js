import _ from 'lodash/fp'
import { createRef, Fragment } from 'react'
import Dropzone from 'react-dropzone'
import { a, div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { Clickable, link, MenuButton, spinnerOverlay } from 'src/components/common'
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


const notebookCardCommonStyles = listView =>
  _.merge({ margin: '1.25rem', display: 'flex' },
    listView ?
      { flexDirection: 'row' } :
      { height: 250, width: 200, flexDirection: 'column' }
  )


class NotebookCard extends Component {
  render() {
    const { namespace, name, updated, listView, bucketName, wsName, reloadList } = this.props
    const { renamingNotebook, copyingNotebook, deletingNotebook } = this.state
    const printName = name.slice(10, -6) // removes 'notebooks/' and the .ipynb suffix

    const hideMenu = () => this.notebookMenu.close()

    const notebookMenu = h(PopupTrigger, {
      ref: instance => this.notebookMenu = instance,
      position: 'bottom',
      content: h(Fragment, [
        h(MenuButton, {
          onClick: () => {
            this.setState({ renamingNotebook: true })
            hideMenu()
          }
        }, ['Rename']),
        h(MenuButton, {
          onClick: () => {
            this.setState({ copyingNotebook: true })
            hideMenu()
          }
        }, ['Duplicate']),
        h(MenuButton, {
          onClick: () => {
            this.setState({ deletingNotebook: true })
            hideMenu()
          }
        }, ['Delete'])
      ])
    }, [
      h(Clickable, {
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
          ...notebookCardCommonStyles(listView),
          flexShrink: 0,
          justifyContent: listView ? undefined : 'space-between',
          alignItems: listView ? 'center' : undefined
        }
      },
      listView ? [
        jupyterIcon,
        title,
        div({ style: { flexGrow: 1 } }),
        div({ style: { fontSize: '0.8rem', marginRight: '0.5rem' } },
          `Last edited: ${Utils.makePrettyDate(updated)}`),
        notebookMenu
      ] :
        [
          div({ style: { display: 'flex', justifyContent: 'space-between' } },
            [title, notebookMenu]),
          jupyterIcon,
          div({ style: { display: 'flex', alignItems: 'flex-end' } }, [
            div({ style: { fontSize: '0.8rem', flexGrow: 1, marginRight: '0.5rem' } }, [
              'Last edited:',
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
    this.uploader = createRef()
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
      [
        div({
          style: {
            ...notebookCardCommonStyles(listView),
            fontSize: listView ? 16 : undefined, lineHeight: listView ? '22px' : undefined
          }
        }, [
          h(Interactive, {
            as: 'div',
            style: _.merge(Style.elements.card, { flexGrow: 1, color: Style.colors.secondary }),
            onClick: () => this.setState({ creating: true })
          }, [
            listView ?
              div([
                'Create a New Notebook',
                icon('plus-circle', { style: { marginLeft: '1rem' }, size: 22 })
              ]) : div({ style: { fontSize: 18, lineHeight: '22px' } }, [
                div(['Create a']),
                div(['New Notebook']),
                icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
              ])
          ]),
          div({ style: { width: 20, height: 15 } }),
          h(Interactive, {
            as: 'div',
            style: _.merge(Style.elements.card,
              { flexGrow: 1, backgroundColor: '#dcdcdc', border: '1px dashed #9B9B9B', boxShadow: 'none' }),
            onClick: () => this.uploader.current.open()
          }, [
            div({ style: listView ? {} : { fontSize: 16, lineHeight: '20px' } }, [
              'Drag or ', link({}, ['Click']), ' to Add an ipynb File',
              icon('upload-cloud', {
                style: {
                  marginLeft: listView ? '1rem' : undefined, marginTop: listView ? undefined : '0.5rem',
                  opacity: 0.4
                }, size: 25
              })
            ])
          ])

        ]),
        ..._.map(({ name, updated }) => h(NotebookCard, {
          name, updated, listView, bucketName, namespace, wsName,
          reloadList: () => this.refresh()
        }), notebooks)
      ]
    )
  }

  render() {
    const { loading, bucketName, notebooks, listView, creating } = this.state
    const { namespace, name } = this.props

    return h(WorkspaceContainer,
      {
        namespace, name, refresh: () => this.refresh(),
        breadcrumbs: breadcrumbs.commonPaths.workspaceDashboard({ namespace, name }),
        title: 'Notebooks', activeTab: 'notebooks'
      },
      [
        h(Dropzone, {
          accept: '.ipynb',
          disableClick: true,
          disablePreview: true,
          style: { flexGrow: 1, padding: '1rem' },
          activeStyle: { backgroundColor: Style.colors.highlight, cursor: 'copy' }, // accept and reject don't work in all browsers
          acceptStyle: { cursor: 'copy' },
          rejectStyle: { cursor: 'no-drop' },
          ref: this.uploader,
          onDropAccepted: acceptedFiles => {
            this.setState({ loading: true })

            acceptedFiles.forEach(file => {
              const reader = new FileReader()

              reader.onload = () => {
                Buckets.notebook(namespace, bucketName, file.name.slice(0, -6)).create(JSON.parse(reader.result)).then(
                  () => this.refresh(),
                  error => {
                    reportError('Error creating notebook', error)
                    this.setState({ loading: false })
                  }
                )
              }
              reader.onerror = e => reportError('Error reading file', e)

              reader.readAsText(file)
            })
          }
        }, [
          notebooks && h(Fragment, [
            div({ style: { display: 'flex', alignItems: 'center', margin: '0 1.25rem' } }, [
              div({ style: { color: Style.colors.title, fontSize: 16, fontWeight: 500 } }, 'NOTEBOOKS'),
              div({ style: { flexGrow: 1 } }),
              div({ style: { color: Style.colors.secondary, padding: '0.5rem 1rem', backgroundColor: 'white', borderRadius: 3 } }, [
                h(Interactive, {
                  as: icon('view-cards'),
                  style: {
                    boxShadow: listView ? undefined : `0 4px 0 ${Style.colors.highlight}`,
                    marginRight: '1rem', width: 26, height: 22
                  },
                  onClick: () => this.setState({ listView: false })
                }),
                h(Interactive, {
                  as: icon('view-list'),
                  style: { boxShadow: listView ? `0 4px 0 ${Style.colors.highlight}` : null },
                  size: 26,
                  onClick: () => this.setState({ listView: true })
                })
              ]),
              creating && h(NotebookCreator, {
                namespace, bucketName,
                reloadList: () => this.refresh(),
                onDismiss: () => this.setState({ creating: false })
              })
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
    component: WorkspaceNotebooks,
    title: ({ name }) => `${name} - Notebooks`
  })
}
