import _ from 'lodash/fp'
import { Component, createRef, Fragment } from 'react'
import Dropzone from 'react-dropzone'
import { a, div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { Clickable, link, MenuButton, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NotebookCreator, NotebookDeleter, NotebookDuplicator } from 'src/components/notebook-utils'
import PopupTrigger from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Buckets } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const notebookCardCommonStyles = listView =>
  _.merge({ margin: '1.25rem', display: 'flex' },
    listView ?
      { flexDirection: 'row' } :
      { height: 250, width: 200, flexDirection: 'column' }
  )

const printName = name => name.slice(10, -6) // removes 'notebooks/' and the .ipynb suffix

const noCompute = 'You do not have access to run analyses on this workspace.'
const noWrite = 'You do not have access to modify this workspace.'

class NotebookCard extends Component {
  constructor(props) {
    super(props)
    this.menu = createRef()
  }

  render() {
    const { namespace, name, updated, listView, wsName, onRename, onCopy, onDelete, canCompute, canWrite } = this.props

    const hideMenu = () => this.menu.current.close()

    const notebookMenu = canWrite && h(PopupTrigger, {
      ref: this.menu,
      position: 'bottom',
      content: h(Fragment, [
        h(MenuButton, {
          onClick: () => {
            onRename()
            hideMenu()
          }
        }, ['Rename']),
        h(MenuButton, {
          onClick: () => {
            onCopy()
            hideMenu()
          }
        }, ['Duplicate']),
        h(MenuButton, {
          onClick: () => {
            onDelete()
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
      } : {
        height: 125,
        width: 'auto',
        color: Style.colors.background
      }
    })

    const title = div({
      title: printName(name),
      style: {
        ...Style.elements.cardTitle,
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'
      }
    }, printName(name))

    return h(Fragment, [
      h(TooltipTrigger, { content: !canCompute ? noCompute : undefined }, [
        a({
          href: canCompute ? Nav.getLink('workspace-notebook-launch', { namespace, name: wsName, notebookName: name.slice(10) }) : undefined,
          style: {
            ...Style.elements.card,
            ...notebookCardCommonStyles(listView),
            flexShrink: 0,
            justifyContent: listView ? undefined : 'space-between',
            alignItems: listView ? 'center' : undefined
          }
        }, listView ? [
          jupyterIcon,
          title,
          div({ style: { flexGrow: 1 } }),
          div({ style: { fontSize: '0.8rem', marginRight: '0.5rem' } },
            `Last edited: ${Utils.makePrettyDate(updated)}`),
          notebookMenu
        ] : [
          div({ style: { display: 'flex', justifyContent: 'space-between' } },
            [title, notebookMenu]),
          jupyterIcon,
          div({ style: { display: 'flex', alignItems: 'flex-end' } }, [
            div({ style: { fontSize: '0.8rem', flexGrow: 1, marginRight: '0.5rem' } }, [
              'Last edited:',
              div({}, Utils.makePrettyDate(updated))
            ])
          ])
        ])
      ])
    ])
  }
}

const WorkspaceNotebooks = wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: 'Notebooks', activeTab: 'notebooks'
},
class NotebooksContent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      renamingNotebookName: undefined,
      copyingNotebookName: undefined,
      deletingNotebookName: undefined,
      ...StateHistory.get()
    }
    this.uploader = createRef()
  }

  async refresh() {
    const { namespace, workspace: { workspace: { bucketName } } } = this.props

    try {
      this.setState({ launching: false, loading: true })
      const notebooks = await Buckets.listNotebooks(namespace, bucketName)
      this.setState({ notebooks: _.reverse(_.sortBy('updated', notebooks)) })
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
    const { notebooks, listView } = this.state
    const { name: wsName, namespace, workspace: { accessLevel, canCompute, workspace: { bucketName } } } = this.props
    const canWrite = Utils.canWrite(accessLevel)

    return div({ style: { display: listView ? undefined : 'flex', flexWrap: 'wrap' } }, [
      div({
        style: {
          ...notebookCardCommonStyles(listView),
          fontSize: listView ? 16 : undefined, lineHeight: listView ? '22px' : undefined
        }
      }, [
        h(Clickable, {
          style: { ...Style.elements.card, flexGrow: 1, color: Style.colors.secondary },
          onClick: () => this.setState({ creating: true }),
          disabled: !canWrite,
          tooltip: !canWrite ? noWrite : undefined
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
        h(Clickable, {
          style: {
            ...Style.elements.card, flexGrow: 1,
            backgroundColor: '#dcdcdc', border: '1px dashed #9B9B9B', boxShadow: 'none'
          },
          onClick: () => this.uploader.current.open(),
          disabled: !canWrite,
          tooltip: !canWrite ? noWrite : undefined
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
      _.map(({ name, updated }) => h(NotebookCard, {
        key: name,
        name, updated, listView, bucketName, namespace, wsName, canCompute, canWrite,
        onRename: () => this.setState({ renamingNotebookName: name }),
        onCopy: () => this.setState({ copyingNotebookName: name }),
        onDelete: () => this.setState({ deletingNotebookName: name })
      }), notebooks)
    ])
  }

  render() {
    const { loading, notebooks, listView, creating, renamingNotebookName, copyingNotebookName, deletingNotebookName } = this.state
    const { namespace, workspace: { accessLevel, workspace: { bucketName } } } = this.props
    const existingNames = _.map(({ name }) => printName(name), notebooks)

    return h(Dropzone, {
      accept: '.ipynb',
      disabled: !Utils.canWrite(accessLevel),
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
        div({
          style: {
            display: 'flex', alignItems: 'center',
            margin: '0 1.25rem'
          }
        }, [
          div({ style: { color: Style.colors.title, fontSize: 16, fontWeight: 500 } }, 'NOTEBOOKS'),
          div({ style: { flexGrow: 1 } }),
          div({ style: { color: Style.colors.secondary, padding: '0.5rem 1rem', backgroundColor: 'white', borderRadius: 3 } }, [
            h(Clickable, {
              as: icon('view-cards'),
              style: {
                color: listView ? null : Style.colors.primary,
                marginRight: '1rem', width: 26, height: 22
              },
              size: 26,
              onClick: () => this.setState({ listView: false })
            }),
            h(Clickable, {
              as: icon('view-list'),
              style: { color: listView ? Style.colors.primary : null },
              size: 26,
              onClick: () => this.setState({ listView: true })
            })
          ]),
          creating && h(NotebookCreator, {
            namespace, bucketName,
            reloadList: () => this.refresh(),
            onDismiss: () => this.setState({ creating: false })
          }),
          renamingNotebookName && h(NotebookDuplicator, {
            printName: printName(renamingNotebookName),
            existingNames, namespace, bucketName, destroyOld: true,
            onDismiss: () => this.setState({ renamingNotebookName: undefined }),
            onSuccess: () => {
              this.setState({ renamingNotebookName: undefined })
              this.refresh()
            }
          }),
          copyingNotebookName && h(NotebookDuplicator, {
            printName: printName(copyingNotebookName),
            existingNames, namespace, bucketName, destroyOld: false,
            onDismiss: () => this.setState({ copyingNotebookName: undefined }),
            onSuccess: () => {
              this.setState({ copyingNotebookName: undefined })
              this.refresh()
            }
          }),
          deletingNotebookName && h(NotebookDeleter, {
            printName: printName(deletingNotebookName), namespace, bucketName,
            onDismiss: () => this.setState({ deletingNotebookName: undefined }),
            onSuccess: () => {
              this.setState({ deletingNotebookName: undefined })
              this.refresh()
            }
          })
        ]),
        this.renderNotebooks()
      ]),
      loading && spinnerOverlay
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['clusters', 'cluster', 'notebooks', 'listView'],
      this.state)
    )
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspace-notebooks', {
    path: '/workspaces/:namespace/:name/notebooks',
    component: WorkspaceNotebooks,
    title: ({ name }) => `${name} - Notebooks`
  })
}
