import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Component, Fragment } from 'react'
import { a, div, h, label, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { ViewToggleButtons, withViewToggle } from 'src/components/CardsListToggle'
import { Clickable, IdContainer, Link, makeMenuIcon, MenuButton, PageBox, Select, spinnerOverlay } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import { NewGalaxyModal } from 'src/components/NewGalaxyModal'
import { findPotentialNotebookLockers, NotebookCreator, NotebookDeleter, NotebookDuplicator, notebookLockHash } from 'src/components/notebook-utils'
import PopupTrigger from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { isAnvil } from 'src/libs/config'
import { reportError, withErrorReporting } from 'src/libs/error'
import { versionTag } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { appIsSettingUp, currentApp, getGalaxyCost } from 'src/libs/runtime-utils'
import { authStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import ExportNotebookModal from 'src/pages/workspaces/workspace/notebooks/ExportNotebookModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const notebookCardCommonStyles = listView => _.merge({ display: 'flex' },
  listView ?
    {
      marginBottom: '0.5rem',
      flexDirection: 'row',
      alignItems: 'center'
    } :
    {
      margin: '0 2.5rem 2.5rem 0',
      height: 100,
      width: 400,
      flexDirection: 'column',
      padding: 0
    }
)

const printName = name => name.slice(10, -6) // removes 'notebooks/' and the .ipynb suffix

const noWrite = 'You do not have access to modify this workspace.'

const sortTokens = {
  lowerCaseName: notebook => notebook.name.toLowerCase()
}
const defaultSort = { label: 'Most Recently Updated', value: { field: 'updated', direction: 'desc' } }
const sortOptions = [
  defaultSort,
  { label: 'Least Recently Updated', value: { field: 'updated', direction: 'asc' } },
  { label: 'Alphabetical', value: { field: 'lowerCaseName', direction: 'asc' } },
  { label: 'Reverse Alphabetical', value: { field: 'lowerCaseName', direction: 'desc' } }
]

const noNotebooksMessage = div({ style: { fontSize: 20 } }, [
  div([
    'To get started, click ', span({ style: { fontWeight: 600 } }, ['Create a New Notebook'])
  ]),
  div({ style: { marginTop: '1rem', fontSize: 16 } }, [
    h(Link, {
      ...Utils.newTabLinkProps,
      href: `https://support.terra.bio/hc/en-us/sections/360004143932`
    }, [`What's a notebook?`])
  ])
])

const NotebookCard = ({ namespace, name, updated, metadata, listView, wsName, onRename, onCopy, onDelete, onExport, canWrite, currentUserHash, potentialLockers }) => {
  const { lockExpiresAt, lastLockedBy } = metadata || {}
  const lockExpirationDate = new Date(parseInt(lockExpiresAt))
  const locked = currentUserHash && lastLockedBy && lastLockedBy !== currentUserHash && lockExpirationDate > Date.now()
  const lockedBy = potentialLockers ? potentialLockers[lastLockedBy] : null

  const notebookLink = Nav.getLink('workspace-notebook-launch', { namespace, name: wsName, notebookName: name.slice(10) })
  const notebookEditLink = `${notebookLink}/?${qs.stringify({ mode: 'edit' })}`
  const notebookPlaygroundLink = `${notebookLink}/?${qs.stringify({ mode: 'playground' })}`

  const notebookMenu = h(PopupTrigger, {
    side: 'right',
    closeOnClick: true,
    content: h(Fragment, [
      h(MenuButton, {
        href: notebookLink,
        tooltip: canWrite && 'Open without cloud compute',
        tooltipSide: 'left'
      }, [makeMenuIcon('eye'), 'Open preview']),
      h(MenuButton, {
        href: notebookEditLink,
        disabled: locked || !canWrite,
        tooltip: !canWrite && noWrite,
        tooltipSide: 'left'
      }, locked ? [makeMenuIcon('lock'), 'Edit (In Use)'] : [makeMenuIcon('edit'), 'Edit']),
      h(MenuButton, {
        href: notebookPlaygroundLink,
        tooltip: canWrite && 'Open in playground mode',
        tooltipSide: 'left'
      }, [makeMenuIcon('chalkboard'), 'Playground']),
      h(MenuButton, {
        disabled: !canWrite,
        tooltip: !canWrite && noWrite,
        tooltipSide: 'left',
        onClick: () => onCopy()
      }, [makeMenuIcon('copy'), 'Make a copy']),
      h(MenuButton, {
        onClick: () => onExport()
      }, [makeMenuIcon('export'), 'Copy to another workspace']),
      h(MenuButton, {
        onClick: async () => {
          try {
            await clipboard.writeText(`${window.location.host}/${notebookLink}`)
            notify('success', 'Successfully copied URL to clipboard', { timeout: 3000 })
          } catch (error) {
            reportError('Error copying to clipboard', error)
          }
        }
      }, [makeMenuIcon('copy-to-clipboard'), 'Copy notebook URL to clipboard']),
      h(MenuButton, {
        disabled: !canWrite,
        tooltip: !canWrite && noWrite,
        tooltipSide: 'left',
        onClick: () => onRename()
      }, [makeMenuIcon('renameIcon'), 'Rename']),
      h(MenuButton, {
        disabled: !canWrite,
        tooltip: !canWrite && noWrite,
        tooltipSide: 'left',
        onClick: () => onDelete()
      }, [makeMenuIcon('trash'), 'Delete'])
    ])
  }, [
    h(Link, { 'aria-label': 'Notebook menu', onClick: e => e.preventDefault() }, [
      icon('cardMenuIcon', {
        size: listView ? 18 : 24
      })
    ])
  ])

  const title = div({
    title: printName(name),
    style: _.merge({
      ...Style.elements.card.title, whiteSpace: 'normal', overflowY: 'auto'
    }, listView ? {
      marginLeft: '1rem'
    } : { height: 60, padding: '1rem' })
  }, printName(name))

  return a({
    href: notebookLink,
    style: {
      ...Style.elements.card.container,
      ...notebookCardCommonStyles(listView),
      flexShrink: 0
    }
  }, listView ? [
    notebookMenu,
    title,
    div({ style: { flexGrow: 1 } }),
    locked && h(Clickable, {
      style: { display: 'flex', paddingRight: '1rem', color: colors.dark(0.75) },
      tooltip: `This notebook is currently being edited by ${lockedBy || 'another user'}`
    }, [icon('lock')]),
    h(TooltipTrigger, { content: Utils.makeCompleteDate(updated) }, [
      div({ style: { fontSize: '0.8rem', marginRight: '0.5rem' } },
        `Last edited: ${Utils.makePrettyDate(updated)}`)
    ])
  ] : [
    div({ style: { display: 'flex' } }, [
      title,
      div({ style: { flexGrow: 1 } }),
      locked && h(Clickable, {
        style: { display: 'flex', padding: '1rem', color: colors.dark(0.75) },
        tooltip: `This notebook is currently being edited by ${lockedBy || 'another user'}`
      }, [icon('lock')])
    ]),
    div({
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: `solid 1px ${colors.dark(0.4)}`,
        paddingLeft: '0.5rem', paddingRight: '0.5rem', height: '2.5rem',
        backgroundColor: colors.light(0.4),
        borderRadius: '0 0 5px 5px'
      }
    }, [
      h(TooltipTrigger, { content: Utils.makeCompleteDate(updated) }, [
        div({ style: { fontSize: '0.8rem', marginRight: '0.5rem' } }, [
          'Last edited: ',
          Utils.makePrettyDate(updated)
        ])
      ]),
      notebookMenu
    ])
  ])
}

const Notebooks = _.flow(
  requesterPaysWrapper({
    onDismiss: () => Nav.history.goBack()
  }),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Notebooks', activeTab: 'notebooks'
  }),
  withViewToggle('notebooksTab'),
  ajaxCaller,
  Utils.connectStore(authStore, 'authState')
)(class Notebooks extends Component {
  constructor(props) {
    super(props)
    this.state = {
      renamingNotebookName: undefined,
      copyingNotebookName: undefined,
      deletingNotebookName: undefined,
      exportingNotebookName: undefined,
      sortOrder: defaultSort.value,
      filter: '',
      ...StateHistory.get()
    }
  }

  getExistingNames() {
    const { notebooks } = this.state
    return _.map(({ name }) => printName(name), notebooks)
  }

  refreshNotebooks = _.flow(
    withRequesterPaysHandler(this.props.onRequesterPaysError),
    withErrorReporting('Error loading notebooks'),
    Utils.withBusyState(v => this.setState({ loading: v }))
  )(async () => {
    const { namespace, workspace: { workspace: { bucketName } }, ajax: { Buckets } } = this.props
    const notebooks = await Buckets.listNotebooks(namespace, bucketName)
    this.setState({ notebooks: _.reverse(_.sortBy('updated', notebooks)) })
  })

  refreshApps = _.flow(
    withErrorReporting('Error loading Apps'),
    Utils.withBusyState(v => this.setState({ loading: v }))
  )(async () => {
    const { refreshApps } = this.props
    await refreshApps()
  })

  async uploadFiles(files) {
    const { namespace, workspace: { workspace: { bucketName } } } = this.props
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
        return Ajax().Buckets.notebook(namespace, bucketName, resolvedName).create(JSON.parse(contents))
      }, files))
      this.refreshNotebooks()
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

  async componentDidMount() {
    const { name: wsName, namespace, workspace: { canShare, workspace: { bucketName } }, authState: { user: { email } } } = this.props
    const [currentUserHash, potentialLockers] = await Promise.all(
      [notebookLockHash(bucketName, email), findPotentialNotebookLockers({ canShare, namespace, wsName, bucketName })])
    this.setState({ currentUserHash, potentialLockers })
    this.refreshNotebooks()
  }

  renderNotebooks(openUploader) {
    const { notebooks, sortOrder: { field, direction }, currentUserHash, potentialLockers, filter } = this.state
    const {
      apps,
      name: wsName, namespace, listView,
      workspace: { accessLevel }
    } = this.props
    const app = currentApp(apps)
    const canWrite = Utils.canWrite(accessLevel)
    const renderedNotebooks = _.flow(
      _.filter(({ name }) => Utils.textMatch(filter, printName(name))),
      _.orderBy(sortTokens[field] || field, direction),
      _.map(({ name, updated, metadata }) => h(NotebookCard, {
        key: name,
        name, updated, metadata, listView, namespace, wsName, canWrite, currentUserHash, potentialLockers,
        onRename: () => this.setState({ renamingNotebookName: name }),
        onCopy: () => this.setState({ copyingNotebookName: name }),
        onExport: () => this.setState({ exportingNotebookName: name }),
        onDelete: () => this.setState({ deletingNotebookName: name })
      }))
    )(notebooks)

    const getGalaxyText = () => {
      return app ?
        div({ style: { fontSize: 18, lineHeight: '22px', width: 160 } }, [
          div(['Galaxy Interactive']),
          div(['Environment']),
          // TODO: Actually use status to calculate cost, and actually use disk rather than hardcoding
          div({ style: { fontSize: 12, marginTop: 6 } }, [_.capitalize(app.status), `: ${Utils.formatUSD(
            getGalaxyCost(app)
          )} per hr`]),
          icon('trash', { size: 21 })
        ]) :
        div({ style: { fontSize: 18, lineHeight: '22px', width: 160, color: colors.accent() } }, [
          div(['Create a Cloud']),
          div(['Environment for ']),
          div(['Galaxy ', versionTag('Alpha', { color: colors.primary(1.5), backgroundColor: 'white', border: `1px solid ${colors.primary(1.5)}` }
          )]),
          icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
        ])
    }

    return div({
      style: { display: 'flex', marginRight: listView ? undefined : '-2.5rem', alignItems: 'flex-start' }
    }, [
      div({
        style: {
          margin: '0 2.5rem 2.5rem 0', display: 'flex',
          width: 200, flexDirection: 'column',
          fontSize: 16, lineHeight: '22px'
        }
      }, [
        h(Clickable, {
          style: {
            ...Style.elements.card.container,
            color: colors.accent(), height: 125
          },
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
        isAnvil() && h(Fragment, [
          h(Clickable, {
            style: {
              ...Style.elements.card.container, height: 125, marginTop: 15
            },
            disabled: appIsSettingUp(app),
            tooltip: appIsSettingUp(app) && 'Your Galaxy app is being created',
            onClick: () => this.setState({ openGalaxyConfigDrawer: true })
          }, [
            getGalaxyText()
          ])
        ]),
        h(Clickable, {
          style: {
            ...Style.elements.card.container, height: 125, marginTop: 15,
            backgroundColor: colors.dark(0.1), border: `1px dashed ${colors.dark(0.7)}`, boxShadow: 'none'
          },
          onClick: openUploader,
          disabled: !canWrite,
          tooltip: !canWrite ? noWrite : undefined
        }, [
          div({ style: { fontSize: 16, lineHeight: '20px' } }, [
            div(['Drag or ', h(Link, ['Click']), ' to ']),
            div(['Add an ipynb File']),
            icon('upload-cloud', { size: 25, style: { opacity: 0.4, marginTop: '0.5rem' } })
          ])
        ])
      ]),
      Utils.cond(
        [_.isEmpty(notebooks), () => noNotebooksMessage],
        [!_.isEmpty(notebooks) && _.isEmpty(renderedNotebooks), () => {
          return div({ style: { fontStyle: 'italic' } }, ['No matching notebooks'])
        }],
        [listView, () => div({ style: { flex: 1 } }, [renderedNotebooks])],
        () => div({ style: { display: 'flex', flexWrap: 'wrap' } }, renderedNotebooks)
      )
    ])
  }

  render() {
    const { loading, saving, notebooks, creating, renamingNotebookName, copyingNotebookName, deletingNotebookName, exportingNotebookName, sortOrder, filter, openGalaxyConfigDrawer } = this.state
    const {
      apps, namespace, name, listView, setListView, workspace,
      workspace: { accessLevel, workspace: { bucketName } }
    } = this.props
    const existingNames = this.getExistingNames()

    return h(Dropzone, {
      accept: '.ipynb',
      disabled: !Utils.canWrite(accessLevel),
      style: { flexGrow: 1 },
      activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
      onDropRejected: () => reportError('Not a valid notebook',
        'The selected file is not a ipynb notebook file. To import a notebook, upload a file with a .ipynb extension.'),
      onDropAccepted: files => this.uploadFiles(files)
    }, [({ openUploader }) => h(Fragment, [
      notebooks && h(PageBox, [
        div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
          div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Notebooks']),
          div({ style: { flex: 1 } }),
          h(DelayedSearchInput, {
            'aria-label': 'Search notebooks',
            style: { marginRight: '0.75rem', width: 220 },
            placeholder: 'SEARCH NOTEBOOKS',
            onChange: v => this.setState({ filter: v }),
            value: filter
          }),
          h(IdContainer, [id => h(Fragment, [
            label({ htmlFor: id, style: { marginLeft: 'auto', marginRight: '0.75rem' } }, ['Sort By:']),
            h(Select, {
              id,
              value: sortOrder,
              isClearable: false,
              styles: { container: old => ({ ...old, width: 220, marginRight: '1.10rem' }) },
              options: sortOptions,
              onChange: selected => this.setState({ sortOrder: selected.value })
            })
          ])]),
          h(ViewToggleButtons, { listView, setListView }),
          creating && h(NotebookCreator, {
            namespace, bucketName, existingNames,
            reloadList: () => this.refreshNotebooks(),
            onDismiss: () => this.setState({ creating: false }),
            onSuccess: () => this.setState({ creating: false })
          }),
          renamingNotebookName && h(NotebookDuplicator, {
            printName: printName(renamingNotebookName),
            namespace, wsName: name, bucketName, destroyOld: true,
            onDismiss: () => this.setState({ renamingNotebookName: undefined }),
            onSuccess: () => {
              this.setState({ renamingNotebookName: undefined })
              this.refreshNotebooks()
            }
          }),
          copyingNotebookName && h(NotebookDuplicator, {
            printName: printName(copyingNotebookName),
            namespace, wsName: name, bucketName, destroyOld: false,
            onDismiss: () => this.setState({ copyingNotebookName: undefined }),
            onSuccess: () => {
              this.setState({ copyingNotebookName: undefined })
              this.refreshNotebooks()
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
              this.refreshNotebooks()
            }
          }),
          h(NewGalaxyModal, {
            isOpen: openGalaxyConfigDrawer,
            workspace,
            apps,
            onDismiss: () => {
              this.setState({ openGalaxyConfigDrawer: false })
            },
            onSuccess: () => {
              this.setState({ openGalaxyConfigDrawer: false })
              this.refreshApps()
            }
          })
        ]),
        this.renderNotebooks(openUploader)
      ]),
      (saving || loading) && spinnerOverlay
    ])])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['notebooks', 'sortOrder', 'filter'],
      this.state)
    )
  }
})

export const navPaths = [
  {
    name: 'workspace-notebooks',
    path: '/workspaces/:namespace/:name/notebooks',
    component: Notebooks,
    title: ({ name }) => `${name} - Notebooks`
  }
]
