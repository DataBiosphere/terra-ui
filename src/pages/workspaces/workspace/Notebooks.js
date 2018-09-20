import _ from 'lodash/fp'
import { createRef, Fragment } from 'react'
import Dropzone from 'react-dropzone'
import { a, div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { Clickable, link, MenuButton, spinnerOverlay, viewToggleButtons } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NotebookCreator, NotebookDeleter, NotebookDuplicator } from 'src/components/notebook-utils'
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
  render() {
    const { namespace, name, updated, listView, wsName, onRename, onCopy, onDelete, canCompute, canWrite } = this.props

    const iconHelp = (iconName, iconLabel) => {
      return h(Fragment, [icon(iconName, { size: 15, style: { marginRight: '.25rem' } }), iconLabel])
    }

    const notebookMenu = canWrite && h(PopupTrigger, {
      position: 'right',
      closeOnClick: true,
      content: h(Fragment, [
        h(MenuButton, {
          onClick: () => onRename()
        }, [iconHelp('renameIcon', 'Rename')]),
        h(MenuButton, {
          onClick: () => onCopy()
        }, [iconHelp('copy', 'Clone')]),
        h(MenuButton, {
          onClick: () => onDelete()
        }, [iconHelp('trash', 'Delete')])
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
          size: listView ? 18 : 27
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
          notebookMenu,
          title,
          div({ style: { flexGrow: 1 } }),
          h(TooltipTrigger, { content: Utils.makeCompleteDate(updated) }, [
            div({ style: { fontSize: '0.8rem', marginRight: '0.5rem' } },
              `Last edited: ${Utils.makePrettyDate(updated)}`)
          ])
        ] : [
          title,
          jupyterIcon,
          div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
            h(TooltipTrigger, { content: Utils.makeCompleteDate(updated) }, [
              div({ style: { fontSize: '0.8rem', flexGrow: 1, marginRight: '0.5rem' } }, [
                'Last edited:',
                div({}, Utils.makePrettyDate(updated))
              ])
            ]),
            notebookMenu
          ])
        ])
      ])
    ])
  }
}

const WorkspaceNotebooks = ajaxCaller(wrapWorkspace({
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

  componentWillMount() {
    this.refresh()
  }

  renderNotebooks() {
    const { notebooks, listView } = this.state
    const { name: wsName, namespace, workspace: { accessLevel, canCompute, workspace: { bucketName } } } = this.props
    const canWrite = Utils.canWrite(accessLevel)
    const renderedNotebooks = _.map(({ name, updated }) => h(NotebookCard, {
      key: name,
      name, updated, listView, bucketName, namespace, wsName, canCompute, canWrite,
      onRename: () => this.setState({ renamingNotebookName: name }),
      onCopy: () => this.setState({ copyingNotebookName: name }),
      onDelete: () => this.setState({ deletingNotebookName: name })
    }), notebooks)

    return div({ style: { display: 'flex', flexWrap: listView ? undefined : 'wrap', padding: '0 2.25rem' } }, [
      div({
        style: {
          margin: '1.25rem', display: 'flex',
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
        div({ style: { flex: 1 } },
          [renderedNotebooks]
        ) : renderedNotebooks
    ])
  }

  render() {
    const { loading, saving, notebooks, listView, creating, renamingNotebookName, copyingNotebookName, deletingNotebookName } = this.state
    const { namespace, workspace: { accessLevel, workspace: { bucketName } } } = this.props
    const existingNames = this.getExistingNames()

    return h(Dropzone, {
      accept: '.ipynb',
      disabled: !Utils.canWrite(accessLevel),
      disableClick: true,
      disablePreview: true,
      style: { flexGrow: 1, padding: '1rem' },
      activeStyle: { backgroundColor: colors.blue[3], cursor: 'copy' }, // accept and reject don't work in all browsers
      acceptStyle: { cursor: 'copy' },
      rejectStyle: { cursor: 'no-drop' },
      ref: this.uploader,
      onDropRejected: () => reportError('Not a valid notebook',
        'The selected file is not a ipynb notebook file. To import a notebook, upload a file with a .ipynb extension.'),
      onDropAccepted: files => this.uploadFiles(files)
    }, [
      notebooks && h(Fragment, [
        div({
          style: {
            display: 'flex', alignItems: 'center',
            margin: '0 1.25rem'
          }
        }, [
          div({ style: { color: colors.darkBlue[0], fontSize: 16, fontWeight: 500, padding: '0 2.25rem' } }, 'NOTEBOOKS'),
          div({ style: { flexGrow: 1 } }),
          viewToggleButtons(listView, listView => this.setState({ listView })),
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
      ['clusters', 'cluster', 'notebooks', 'listView'],
      this.state)
    )
  }
}))

export const addNavPaths = () => {
  Nav.defPath('workspace-notebooks', {
    path: '/workspaces/:namespace/:name/notebooks',
    component: WorkspaceNotebooks,
    title: ({ name }) => `${name} - Notebooks`
  })
}
