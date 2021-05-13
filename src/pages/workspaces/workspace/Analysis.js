import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useState } from 'react'
import { a, div, h, img, label, p, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { ViewToggleButtons, withViewToggle } from 'src/components/CardsListToggle'
import {
  ButtonPrimary,
  Clickable,
  IdContainer,
  Link,
  makeMenuIcon,
  MenuButton,
  PageBox,
  Select,
  spinnerOverlay
} from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
//TODO
import { findPotentialNotebookLockers, NotebookCreator, NotebookDeleter, NotebookDuplicator, notebookLockHash } from 'src/components/notebook-utils'
import PopupTrigger from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { authStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import ExportNotebookModal from 'src/pages/workspaces/workspace/notebooks/ExportNotebookModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import rstudioLogo from 'src/images/rstudio-logo.svg'
import galaxyLogo from 'src/images/galaxy-logo.png'


const analysisCardCommonStyles = listView => _.merge({ display: 'flex' },
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
//TODO: .rmd
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

const AnalysisCard = ({ namespace, name, updated, metadata, listView, wsName, onRename, onCopy, onDelete, onExport, canWrite, currentUserHash, potentialLockers }) => {
  const { lockExpiresAt, lastLockedBy } = metadata || {}
  const lockExpirationDate = new Date(parseInt(lockExpiresAt))
  const locked = currentUserHash && lastLockedBy && lastLockedBy !== currentUserHash && lockExpirationDate > Date.now()
  const lockedBy = potentialLockers ? potentialLockers[lastLockedBy] : null

  //TODO: proper link
  const analysisLink = Nav.getLink('workspace-notebook-launch', { namespace, name: wsName, notebookName: name.slice(10) })
  const analysisEditLink = `${analysisLink}/?${qs.stringify({ mode: 'edit' })}`
  const analysisPlaygroundLink = `${analysisLink}/?${qs.stringify({ mode: 'playground' })}`

  const analysisMenu = h(PopupTrigger, {
    side: 'right',
    closeOnClick: true,
    content: h(Fragment, [
      h(MenuButton, {
        href: analysisLink,
        tooltip: canWrite && 'Open without cloud compute',
        tooltipSide: 'left'
      }, [makeMenuIcon('eye'), 'Open preview']),
      h(MenuButton, {
        href: analysisEditLink,
        disabled: locked || !canWrite,
        tooltip: !canWrite && noWrite,
        tooltipSide: 'left'
      }, locked ? [makeMenuIcon('lock'), 'Edit (In Use)'] : [makeMenuIcon('edit'), 'Edit']),
      h(MenuButton, {
        href: analysisPlaygroundLink,
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
            await clipboard.writeText(`${window.location.host}/${analysisLink}`)
            notify('success', 'Successfully copied URL to clipboard', { timeout: 3000 })
          } catch (error) {
            reportError('Error copying to clipboard', error)
          }
        }
      }, [makeMenuIcon('copy-to-clipboard'), 'Copy analysis URL to clipboard']),
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
    h(Link, { 'aria-label': 'Analysis menu', onClick: e => e.preventDefault() }, [
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
      marginLeft: '1rem', flexGrow: 1
    } : { height: 60, padding: '1rem' })
  }, printName(name))

  return a({
    href: analysisLink,
    style: {
      ...Style.elements.card.container,
      ...analysisCardCommonStyles(listView),
      flexShrink: 0
    }
  }, listView ? [
    analysisMenu,
    title,
    div({ style: { flexGrow: 1 } }),
    locked && h(Clickable, {
      style: { display: 'flex', paddingRight: '1rem', color: colors.dark(0.75) },
      tooltip: `This analysis is currently being edited by ${lockedBy || 'another user'}`
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
        tooltip: `This analysis is currently being edited by ${lockedBy || 'another user'}`
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
      analysisMenu
    ])
  ])
}

const Analysis = _.flow(
  Utils.forwardRefWithName('Analysis'),
  requesterPaysWrapper({
    onDismiss: () => Nav.history.goBack()
  }),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Analysis', activeTab: 'analysis'
  }),
  withViewToggle('analysisTab')
)(({
  apps, name: wsName, namespace, workspace, workspace: { accessLevel, canShare, workspace: { bucketName } },
  refreshApps, onRequesterPaysError, listView, setListView
}) => {
  // State
  const [renamingNotebookName, setRenamingNotebookName] = useState(undefined)
  const [copyingNotebookName, setCopyingNotebookName] = useState(undefined)
  const [deletingNotebookName, setDeletingNotebookName] = useState(undefined)
  const [exportingNotebookName, setExportingNotebookName] = useState(undefined)
  const [sortOrder, setSortOrder] = useState(() => StateHistory.get().sortOrder || defaultSort.value)
  const [filter, setFilter] = useState(() => StateHistory.get().filter || '')
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  //TODO 2: add all artefacts
  //TODO: galaxy artefacts
  const [notebooks, setNotebooks] = useState(() => StateHistory.get().notebooks || undefined)
  const [rmd, setRmd] = useState(() => StateHistory.get().rmd || undefined)
  const [currentUserHash, setCurrentUserHash] = useState(undefined)
  const [potentialLockers, setPotentialLockers] = useState(undefined)

  const authState = Utils.useStore(authStore)
  const signal = Utils.useCancellation()

  // Helpers
  const existingNames = _.map(({ name }) => printName(name), notebooks)

  //TODO 1.5: refresh analysis
  const refreshNotebooks = _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error loading notebooks'),
    Utils.withBusyState(setBusy)
  )(async () => {
    const notebooks = await Ajax(signal).Buckets.listNotebooks(namespace, bucketName)
    setNotebooks(_.reverse(_.sortBy('updated', notebooks)))
    const rmd =  await Ajax(signal).Buckets.listRmd(namespace, bucketName)
    console.log('in refresh, notebooks are:')
    console.dir(notebooks)
  })

  //TODO: eventually load app artefacts

  // const doAppRefresh = _.flow(
  //   withErrorReporting('Error loading Apps'),
  //   Utils.withBusyState(setBusy)
  // )(refreshApps)

  //TODO 6: upload analyses (should we add .rmd?)
  const uploadFiles = Utils.withBusyState(setBusy, async files => {
    try {
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
      refreshNotebooks()
    } catch (error) {
      if (error instanceof SyntaxError) {
        reportError('Error uploading notebook', 'This ipynb file is not formatted correctly.')
      } else {
        reportError('Error creating notebook', error)
      }
    }
  })

  // Lifecycle
  Utils.useOnMount(() => {
    const load = async () => {
      const [currentUserHash, potentialLockers] = await Promise.all(
        [notebookLockHash(bucketName, authState.user.email), findPotentialNotebookLockers({ canShare, namespace, wsName, bucketName })])
      setCurrentUserHash(currentUserHash)
      setPotentialLockers(potentialLockers)
      refreshNotebooks()
    }

    load()
  })

  useEffect(() => {
    StateHistory.update({ notebooks, sortOrder, filter })
  }, [notebooks, sortOrder, filter])

  const noAnalysisBanner = div([
    div({style: { fontSize: 48 } }, ['A place for all your analyses ']),
    div({ style : { display: 'flex', flexDirection: 'row', justifyContent: 'center' } }, [
      img({ src: jupyterLogo, style: { height: 150, width: 100, marginRight: '12rem'} }),
      img({ src: rstudioLogo, style: { height: 150, width: 170, marginRight: '10rem' } }),
      div( [
        img({ src: galaxyLogo, style: { height: 75, width: 260, marginTop: '2.5rem' } })
        // span({ style: { marginTop: '3.5rem'} }, ['Galaxy'])
      ])
    ]),
    //TODO, check with Joy, wording change (it may not be their first, just first in this workspace)
    div({ style: { marginTop: '1rem', fontSize: 20 } }, [
      `Select one of the applications above to create an analysis.`
    ])
  ])

  // Render helpers
  //TODO 3: anlysis
  const renderNotebooks = openUploader => {
    const { field, direction } = sortOrder
    const canWrite = Utils.canWrite(accessLevel)
    const renderedNotebooks = _.flow(
      _.filter(({ name }) => Utils.textMatch(filter, printName(name))),
      _.orderBy(sortTokens[field] || field, direction),
      _.map(({ name, updated, metadata }) => h(AnalysisCard, {
        key: name,
        name, updated, metadata, listView, namespace, wsName, canWrite, currentUserHash, potentialLockers,
        onRename: () => setRenamingNotebookName(name),
        onCopy: () => setCopyingNotebookName(name),
        onExport: () => setExportingNotebookName(name),
        onDelete: () => setDeletingNotebookName(name)
      }))
    )(notebooks)

    return div([
      //{ style: { display: 'flex', marginRight: listView ? undefined : '-2.5rem', alignItems: 'flex-start' } },
      div({
        style: {
          margin: '0 2.5rem 2.5rem 0', display: 'flex',
          width: 200, flexDirection: 'column',
          fontSize: 16, lineHeight: '22px'
        }
      }, [
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
      div({
        style: {
          textAlign: 'center'
        }
      }, [
        Utils.cond(
          [_.isEmpty(notebooks), () => noAnalysisBanner],
          [!_.isEmpty(notebooks) && _.isEmpty(renderedNotebooks), () => {
            return div({ style: { fontStyle: 'italic' } }, ['No matching analyses'])
          }],
          [listView, () => div({ style: { flex: 1 } }, [renderedNotebooks])],
          () => div({ style: { display: 'flex', flexWrap: 'wrap' } }, renderedNotebooks)
        )
      ])
    ])
  }

  // Render
  return h(Dropzone, {
    //TODO: add .rmd
    accept: '.ipynb',
    disabled: !Utils.canWrite(accessLevel),
    style: { flexGrow: 1 },
    activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
    onDropRejected: () => reportError('Not a valid notebook',
      'The selected file is not a ipynb notebook file. To import a notebook, upload a file with a .ipynb extension.'),
    onDropAccepted: uploadFiles
  }, [({ openUploader }) => h(Fragment, [
    notebooks && h(PageBox, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
        div({ style: { color: colors.dark(), fontSize: 24, fontWeight: 600 } }, ['Your Analyses']),
        //TODO: style
        h(ButtonPrimary, {
          style: {
            marginLeft: '6.5rem'
          },
          onClick: () => setCreating(true),
          disabled: !Utils.canWrite(accessLevel),
          tooltip: !Utils.canWrite(accessLevel) ? noWrite : undefined
        }, [
          div({ style: { } },[
            icon('plus-circle', { style: { marginTop: '0.5rem', marginRight: '0.5rem' }, size: 21 }),
            'Create'
          ])
        ]),
        div({ style: { flex: 2 } }),
        !_.isEmpty(notebooks) && h(DelayedSearchInput, {
          'aria-label': 'Search analyses',
          style: { marginRight: '0.75rem', width: 220 },
          placeholder: 'Search analyses',
          onChange: setFilter,
          value: filter
        }),
        !_.isEmpty(notebooks) && h(IdContainer, [id => h(Fragment, [
          label({ htmlFor: id, style: { marginLeft: 'auto', marginRight: '0.75rem' } }, ['Sort By:']),
          h(Select, {
            id,
            value: sortOrder,
            isClearable: false,
            styles: { container: old => ({ ...old, width: 220, marginRight: '1.10rem' }) },
            options: sortOptions,
            onChange: selected => setSortOrder(selected.value)
          })
        ])]),
        !_.isEmpty(notebooks) && h(ViewToggleButtons, { listView, setListView }),
        //TODO: create impl
        creating && h(NotebookCreator, {
          namespace, bucketName, existingNames,
          reloadList: refreshNotebooks,
          onDismiss: () => setCreating(false),
          onSuccess: () => setCreating(false)
        }),
        renamingNotebookName && h(NotebookDuplicator, {
          printName: printName(renamingNotebookName),
          namespace, wsName, bucketName, destroyOld: true,
          onDismiss: () => setRenamingNotebookName(undefined),
          onSuccess: () => {
            setRenamingNotebookName(undefined)
            refreshNotebooks()
          }
        }),
        copyingNotebookName && h(NotebookDuplicator, {
          printName: printName(copyingNotebookName),
          namespace, wsName, bucketName, destroyOld: false,
          onDismiss: () => setCopyingNotebookName(undefined),
          onSuccess: () => {
            setCopyingNotebookName(undefined)
            refreshNotebooks()
          }
        }),
        exportingNotebookName && h(ExportNotebookModal, {
          printName: printName(exportingNotebookName), workspace,
          onDismiss: () => setExportingNotebookName(undefined)
        }),
        deletingNotebookName && h(NotebookDeleter, {
          printName: printName(deletingNotebookName), namespace, bucketName,
          onDismiss: () => setDeletingNotebookName(undefined),
          onSuccess: () => {
            setDeletingNotebookName(undefined)
            refreshNotebooks()
          }
        })
      ]),
      renderNotebooks(openUploader)
    ]),
    busy && spinnerOverlay
  ])])
})

export const navPaths = [
  {
    name: 'workspace-analysis',
    path: '/workspaces/:namespace/:name/analysis',
    component: Analysis,
    title: ({ name }) => `${name} - Analysis`
  }
]
