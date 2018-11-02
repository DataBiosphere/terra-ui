import clipboard from 'clipboard-polyfill/build/clipboard-polyfill'
import _ from 'lodash/fp'
import { createRef, Fragment } from 'react'
import Dropzone from 'react-dropzone'
import { a, div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import togglesListView from 'src/components/CardsListToggle'
import { Clickable, link, MenuButton, PageFadeBox, spinnerOverlay, menuIcon } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NotebookCreator, NotebookDeleter, NotebookDuplicator } from 'src/components/notebook-utils'
import { pushNotification } from 'src/components/Notifications'
import PopupTrigger from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import ExportNotebookModal from 'src/pages/workspaces/workspace/notebooks/ExportNotebookModal'


const notebookCardCommonStyles = listView => _.merge({ display: 'flex' },
  listView ?
    { marginBottom: '0.5rem', flexDirection: 'row' } :
    { margin: '0 2.5rem 2.5rem 0', height: 250, width: 200, flexDirection: 'column' }
)

const printName = name => name.slice(10, -6) // removes 'notebooks/' and the .ipynb suffix

const noWrite = 'You do not have access to modify this workspace.'

class NotebookCard extends Component {
  render() {
    const { namespace, name, updated, listView, wsName, onRename, onCopy, onDelete, onExport, canWrite } = this.props
    const notebookLink = Nav.getLink('workspace-notebook-launch', { namespace, name: wsName, notebookName: name.slice(10) })

    const notebookMenu = h(PopupTrigger, {
      position: 'right',
      closeOnClick: true,
      content: h(Fragment, [
        h(MenuButton, {
          onClick: async () => {
            try {
              await clipboard.writeText(`${window.location.host}/${notebookLink}`)
              pushNotification({ message: 'Successfully copied URL to clipboard' })
            } catch (error) {
              reportError('Error copying to clipboard', error)
            }
          }
        }, [menuIcon('copy-to-clipboard'), 'Copy notebook URL to clipboard']),
        h(MenuButton, {
          disabled: !canWrite,
          tooltip: !canWrite && noWrite,
          tooltipSide: 'left',
          onClick: () => onRename()
        }, [menuIcon('renameIcon'), 'Rename']),
        h(MenuButton, {
          disabled: !canWrite,
          tooltip: !canWrite && noWrite,
          tooltipSide: 'left',
          onClick: () => onCopy()
        }, [menuIcon('copy'), 'Duplicate']),
        h(MenuButton, {
          onClick: () => onExport()
        }, [menuIcon('export'), 'Copy to another workspace']),
        h(MenuButton, {
          disabled: !canWrite,
          tooltip: !canWrite && noWrite,
          tooltipSide: 'left',
          onClick: () => onDelete()
        }, [menuIcon('trash'), 'Delete'])
      ])
    }, [
      h(Clickable, {
        onClick: e => e.preventDefault(),
        style: {
          cursor: 'pointer', color: colors.blue[0]
        },
        focus: 'hover',
        hover: { color: colors.blue[2] }
      }, [
        icon('cardMenuIcon', {
          size: listView ? 18 : 24
        })
      ])
    ])

    const jupyterIcon = icon('jupyterIcon', {
      style: {
        height: 125,
        width: 'auto',
        color: colors.gray[5]
      }
    })

    const title = div({
      title: printName(name),
      style: listView ? {
        ...Style.elements.cardTitle,
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden',
        marginLeft: '1rem'
      } : {
        ...Style.elements.cardTitle,
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'
      }
    }, printName(name))

    const date = new Date(updated)
    const now = new Date()
    const tenMinutesAgo = _.tap(d => d.setMinutes(d.getMinutes() - 10), new Date(now))
    const recent = date > tenMinutesAgo

    return a({
      href: notebookLink,
      style: {
        ...Style.elements.card,
        ...notebookCardCommonStyles(listView),
        flexShrink: 0,
        justifyContent: listView ? undefined : 'space-between',
        alignItems: listView ? 'center' : undefined
      }
    }, listView ? [
      notebookMenu,
      title,
      div({ style: { flexGrow: 1 } }),
      h(TooltipTrigger, { content: Utils.makeCompleteDate(updated) }, [
        div({ style: { fontSize: '0.8rem', marginRight: '0.5rem', color: recent ? colors.orange[0] : undefined } },
          `Last edited: ${Utils.makePrettyDate(updated)}`)
      ])
    ] : [
      title,
      jupyterIcon,
      div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
        h(TooltipTrigger, { content: Utils.makeCompleteDate(updated) }, [
          div({ style: { fontSize: '0.8rem', flexGrow: 1, marginRight: '0.5rem', color: recent ? colors.orange[0] : undefined  } }, [
            'Last edited:',
            div({}, Utils.makePrettyDate(updated))
          ])
        ]),
        notebookMenu
      ])
    ])
  }
}

const Notebooks = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Notebooks', activeTab: 'notebooks'
  }),
  togglesListView('notebooksTab'),
  ajaxCaller
)(class Notebooks extends Component {
  constructor(props) {
    super(props)
    this.state = {
      renamingNotebookName: undefined,
      copyingNotebookName: undefined,
      deletingNotebookName: undefined,
      exportingNotebookName: undefined,
      ...StateHistory.get()
    }
    this.uploader = createRef()
  }

  getExistingNames() {
    const { notebooks } = this.state
    return _.map(({ name }) => printName(name), notebooks)
  }

  async refresh() {
    const { namespace, workspace: { workspace: { bucketName } }, ajax: { Buckets } } = this.props

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

  async uploadFiles(files) {
    const { namespace, workspace: { workspace: { bucketName } }, ajax: { Buckets } } = this.props
    const existingNames = this.getExistingNames()
    try {
      this.setState({ saving: true })
      await Promise.all(_.map(async file => {
        const name = file.name.slice(0, -6)
        let resolvedName = name
        let c = 0
        while (_.includes(resolvedName, existingNames)) {
          resolvedName = `${name} ${++c}`
        }
        const contents = await Utils.readFileAsText(file)
        return Buckets.notebook(namespace, bucketName, resolvedName).create(JSON.parse(contents))
      }, files))
      this.refresh()
    } catch (error) {
      if (error instanceof SyntaxError) {
        reportError('Error uploading notebook', 'This ipynb file is not formatted correctly.')
      } else {
        reportError('Error creating notebook', error)
      }
    } finally {
      this.setState({ saving: false })
    }
  }

  componentDidMount() {
    this.refresh()
  }

  renderNotebooks() {
    const { notebooks } = this.state
    const {
      name: wsName, namespace, listView,
      workspace: { accessLevel, workspace: { bucketName } }
    } = this.props
    const canWrite = Utils.canWrite(accessLevel)
    const renderedNotebooks = _.map(({ name, updated }) => h(NotebookCard, {
      key: name,
      name, updated, listView, bucketName, namespace, wsName, canWrite,
      onRename: () => this.setState({ renamingNotebookName: name }),
      onCopy: () => this.setState({ copyingNotebookName: name }),
      onExport: () => this.setState({ exportingNotebookName: name }),
      onDelete: () => this.setState({ deletingNotebookName: name })
    }), notebooks)

    return div({
      style: {
        display: 'flex', flexWrap: listView ? undefined : 'wrap',
        marginRight: listView ? undefined : '-2.5rem'
      }
    }, [
      div({
        style: {
          margin: '0 2.5rem 2.5rem 0', display: 'flex',
          height: 250, width: 200, flexDirection: 'column',
          fontSize: 16, lineHeight: '22px'
        }
      }, [
        h(Clickable, {
          style: { ...Style.elements.card, flex: 1, color: colors.blue[0] },
          onClick: () => this.setState({ creating: true }),
          disabled: !canWrite,
          tooltip: !canWrite ? noWrite : undefined
        }, [
          div({ style: { fontSize: 18, lineHeight: '22px', width: 150 } }, [
            div(['Create a']),
            div(['New Notebook']),
            icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
          ])
        ]),
        div({ style: { width: 20, height: 15 } }),
        h(Clickable, {
          style: {
            ...Style.elements.card, flex: 1,
            backgroundColor: colors.gray[4], border: `1px dashed ${colors.gray[2]}`, boxShadow: 'none'
          },
          onClick: () => this.uploader.current.open(),
          disabled: !canWrite,
          tooltip: !canWrite ? noWrite : undefined
        }, [
          div({ style: { fontSize: 16, lineHeight: '20px' } }, [
            div(['Drag or ', link({}, ['Click']), ' to ']),
            div(['Add an ipynb File']),
            icon('upload-cloud', { size: 25, style: { opacity: 0.4, marginTop: '0.5rem' } })
          ])
        ])
      ]),
      listView ?
        div({ style: { flex: 1 } }, [
          renderedNotebooks
        ]) : renderedNotebooks
    ])
  }

  render() {
    const { loading, saving, notebooks, creating, renamingNotebookName, copyingNotebookName, deletingNotebookName, exportingNotebookName } = this.state
    const {
      namespace, viewToggleButtons, workspace,
      workspace: { accessLevel, workspace: { bucketName } }
    } = this.props
    const existingNames = this.getExistingNames()

    return h(Dropzone, {
      accept: '.ipynb',
      disabled: !Utils.canWrite(accessLevel),
      disableClick: true,
      disablePreview: true,
      style: { flexGrow: 1 },
      activeStyle: { backgroundColor: colors.blue[3], cursor: 'copy' }, // accept and reject don't work in all browsers
      acceptStyle: { cursor: 'copy' },
      rejectStyle: { cursor: 'no-drop' },
      ref: this.uploader,
      onDropRejected: () => reportError('Not a valid notebook',
        'The selected file is not a ipynb notebook file. To import a notebook, upload a file with a .ipynb extension.'),
      onDropAccepted: files => this.uploadFiles(files)
    }, [
      notebooks && h(PageFadeBox, {}, [
        div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
          div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Notebooks']),
          viewToggleButtons,
          creating && h(NotebookCreator, {
            namespace, bucketName, existingNames,
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
          exportingNotebookName && h(ExportNotebookModal, {
            printName: printName(exportingNotebookName), workspace,
            onDismiss: () => this.setState({ exportingNotebookName: undefined })
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
      (saving || loading) && spinnerOverlay
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['clusters', 'cluster', 'notebooks'],
      this.state)
    )
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspace-notebooks', {
    path: '/workspaces/:namespace/:name/notebooks',
    component: Notebooks,
    title: ({ name }) => `${name} - Notebooks`
  })
}
