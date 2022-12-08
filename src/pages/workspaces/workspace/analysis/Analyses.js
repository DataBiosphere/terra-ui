import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useState } from 'react'
import { a, div, h, img, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { withViewToggle } from 'src/components/CardsListToggle'
import { ButtonOutline, Clickable, DeleteConfirmationModal, HeaderRenderer, Link, PageBox, spinnerOverlay } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import { makeMenuIcon, MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { ariaSort } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import galaxyLogo from 'src/images/galaxy-logo.svg'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import rstudioBioLogo from 'src/images/r-bio-logo.svg'
import rstudioSquareLogo from 'src/images/rstudio-logo-square.png'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { findPotentialNotebookLockers, getExtension, getFileName, notebookLockHash } from 'src/pages/workspaces/workspace/analysis/file-utils'
import { AnalysisDuplicator } from 'src/pages/workspaces/workspace/analysis/modals/AnalysisDuplicator'
import { AnalysisModal } from 'src/pages/workspaces/workspace/analysis/modals/AnalysisModal'
import ExportAnalysisModal from 'src/pages/workspaces/workspace/analysis/modals/ExportAnalysisModal'
import { analysisLauncherTabName, analysisTabName, appLauncherTabName } from 'src/pages/workspaces/workspace/analysis/runtime-common'
import { getCurrentRuntime } from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import { getToolFromFileExtension, getToolFromRuntime, runtimeTools, toolLabels, tools } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const tableFields = {
  application: 'application',
  name: 'name',
  lastModified: 'lastModified'
}

const KEY_ANALYSES_SORT_ORDER = 'AnalysesSortOrder'

const noWrite = 'You do not have access to modify this workspace.'

const sortTokens = {
  name: notebook => notebook.name.toLowerCase()
}
const defaultSort = { value: { field: tableFields.lastModified, direction: 'desc' } }

const analysisContextMenuSize = 16
const centerColumnFlex = { flex: 5 }
const endColumnFlex = { flex: '0 0 150px', display: 'flex', justifyContent: 'flex-left', whiteSpace: 'nowrap' }

const AnalysisCardHeaders = ({ sort, onSort }) => {
  return div({ style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingLeft: '1.5rem', marginBottom: '0.5rem' } }, [
    div({ 'aria-sort': ariaSort(sort, tableFields.application), style: { flex: 1 } }, [
      h(HeaderRenderer, { sort, onSort, name: tableFields.application })
    ]),
    div({ 'aria-sort': ariaSort(sort, tableFields.name), style: centerColumnFlex }, [
      h(HeaderRenderer, { sort, onSort, name: tableFields.name })
    ]),
    div({ 'aria-sort': ariaSort(sort, tableFields.lastModified), style: { ...endColumnFlex, paddingRight: '1rem' } }, [
      h(HeaderRenderer, { sort, onSort, name: tableFields.lastModified })
    ]),
    div({ style: { flex: `0 0 ${analysisContextMenuSize}px` } }, [
      div({ className: 'sr-only' }, ['Expand'])
    ])
  ])
}

const AnalysisCard = ({
  currentRuntime, namespace, name, lastModified, metadata, application, workspaceName, onRename, onCopy, onDelete, onExport, canWrite,
  currentUserHash, potentialLockers
}) => {
  const { lockExpiresAt, lastLockedBy } = metadata || {}
  const lockExpirationDate = new Date(parseInt(lockExpiresAt))
  const locked = currentUserHash && lastLockedBy && lastLockedBy !== currentUserHash && lockExpirationDate > Date.now()
  const lockedBy = potentialLockers ? potentialLockers[lastLockedBy] : null

  const analysisName = getFileName(name)
  const analysisLink = Nav.getLink(analysisLauncherTabName, { namespace, name: workspaceName, analysisName })
  const toolLabel = getToolFromFileExtension(name)

  const currentRuntimeTool = getToolFromRuntime(currentRuntime)

  const rstudioLaunchLink = Nav.getLink(appLauncherTabName, { namespace, name, application: 'RStudio' })
  const analysisEditLink = `${analysisLink}/?${qs.stringify({ mode: 'edit' })}`
  const analysisPlaygroundLink = `${analysisLink}/?${qs.stringify({ mode: 'playground' })}`

  const analysisMenu = h(MenuTrigger, {
    'aria-label': 'Analysis menu',
    side: 'right',
    closeOnClick: true,
    content: h(Fragment, [
      h(MenuButton, {
        'aria-label': 'Preview',
        href: analysisLink,
        tooltip: canWrite && 'Open without cloud compute',
        tooltipSide: 'left'
      }, [makeMenuIcon('eye'), 'Open preview']),
      ...(toolLabel === toolLabels.Jupyter ? [
        h(MenuButton, {
          'aria-label': 'Edit',
          href: analysisEditLink,
          disabled: locked || !canWrite || currentRuntimeTool === toolLabels.RStudio,
          tooltip: Utils.cond([!canWrite, () => noWrite],
            [currentRuntimeTool === toolLabels.RStudio, () => 'You must have a runtime with Jupyter to edit.']),
          tooltipSide: 'left'
        }, locked ? [makeMenuIcon('lock'), 'Open (In Use)'] : [makeMenuIcon('edit'), 'Edit']),
        h(MenuButton, {
          'aria-label': 'Playground',
          href: analysisPlaygroundLink,
          tooltip: canWrite && 'Open in playground mode',
          tooltipSide: 'left'
        }, [makeMenuIcon('chalkboard'), 'Playground'])
      ] : [
        h(MenuButton, {
          'aria-label': 'Launch',
          href: rstudioLaunchLink,
          disabled: !canWrite || currentRuntimeTool === toolLabels.Jupyter,
          tooltip: Utils.cond([!canWrite, () => noWrite],
            [currentRuntimeTool === toolLabels.RStudio, () => 'You must have a runtime with RStudio to launch.']),
          tooltipSide: 'left'
        }, [makeMenuIcon('rocket'), 'Open'])
      ]),
      h(MenuButton, {
        'aria-label': 'Copy',
        disabled: !canWrite,
        tooltip: !canWrite && noWrite,
        tooltipSide: 'left',
        onClick: () => onCopy()
      }, [makeMenuIcon('copy'), 'Make a copy']),
      h(MenuButton, {
        'aria-label': 'Export',
        onClick: () => onExport()
      }, [makeMenuIcon('export'), 'Copy to another workspace']),
      h(MenuButton, {
        'aria-label': 'Copy',
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
        'aria-label': 'Rename',
        disabled: !canWrite,
        tooltip: !canWrite && noWrite,
        tooltipSide: 'left',
        onClick: () => onRename()
      }, [makeMenuIcon('renameIcon'), 'Rename']),
      h(MenuButton, {
        'aria-label': 'Delete',
        disabled: !canWrite,
        tooltip: !canWrite && noWrite,
        tooltipSide: 'left',
        onClick: () => onDelete()
      }, [makeMenuIcon('trash'), 'Delete'])
    ])
  }, [
    h(Link, { 'aria-label': 'Analyses menu', onClick: e => e.preventDefault() }, [
      icon('ellipsis-v', {
        size: analysisContextMenuSize
      })
    ])
  ])

  //the flex values for columns here correspond to the flex values in the header
  const artifactName = div({
    title: getFileName(name),
    style: {
      ...Style.elements.card.title, whiteSpace: 'normal', overflowY: 'auto', textAlign: 'left', ...centerColumnFlex
    }
  }, [getFileName(name)])

  const toolIconSrc = Utils.switchCase(application,
    [toolLabels.Jupyter, () => jupyterLogo],
    [toolLabels.RStudio, () => rstudioSquareLogo],
    [toolLabels.JupyterLab, () => jupyterLogo]
  )

  const toolIcon = div({ style: { marginRight: '1rem' } }, [
    img({ src: toolIconSrc, style: { height: 40, width: 40 } })
  ])

  const toolContainer = div({ style: { display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center' } }, [
    toolIcon,
    // this is the tool name, i.e. 'Jupyter'. It is named identical to the header row to simplify the sorting code at the cost of naming consistency.
    application
  ])

  return a({
    href: analysisLink,
    style: _.merge({
      ...Style.cardList.longCardShadowless
    }, { marginBottom: '.75rem', paddingLeft: '1.5rem' })
  }, [
    toolContainer,
    artifactName,
    div({ style: { ...endColumnFlex, flexDirection: 'row' } }, [
      div({ style: { flex: 1, display: 'flex' } }, [
        locked && h(Clickable, {
          'aria-label': `${artifactName} artifact label`,
          style: { display: 'flex', paddingRight: '1rem', color: colors.dark(0.75) },
          tooltip: `This analysis is currently being edited by ${lockedBy || 'another user'}`
        }, [icon('lock')]),
        h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [
          div({ style: { fontSize: '0.8rem', display: 'flex', alignItems: 'center', textAlign: 'left' } }, [Utils.makePrettyDate(lastModified)])
        ])
      ]),
      div({ style: { marginLeft: '1rem' } }, [analysisMenu])
    ])
  ])
}

const Analyses = _.flow(
  forwardRefWithName('Analyses'),
  requesterPaysWrapper({
    onDismiss: () => Nav.history.goBack()
  }),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Analyses',
    activeTab: 'analyses'
  }),
  withViewToggle('analysesTab')
)(({
  name: workspaceName, namespace, workspace, workspace: { accessLevel, canShare, workspace: { workspaceId, googleProject, bucketName } },
  analysesData: { apps, refreshApps, runtimes, refreshRuntimes, appDataDisks, persistentDisks, location },
  onRequesterPaysError
}, _ref) => {
  const [renamingAnalysisName, setRenamingAnalysisName] = useState(undefined)
  const [copyingAnalysisName, setCopyingAnalysisName] = useState(undefined)
  const [deletingAnalysisName, setDeletingAnalysisName] = useState(undefined)
  const [exportingAnalysisName, setExportingAnalysisName] = useState(undefined)
  const [sortOrder, setSortOrder] = useState(() => getLocalPref(KEY_ANALYSES_SORT_ORDER) || defaultSort.value)
  const [filter, setFilter] = useState(() => StateHistory.get().filter || '')
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [analyses, setAnalyses] = useState(() => StateHistory.get().analyses || undefined)
  const [currentUserHash, setCurrentUserHash] = useState(undefined)
  const [potentialLockers, setPotentialLockers] = useState(undefined)
  const [activeFileTransfers, setActiveFileTransfers] = useState(false)

  const authState = useStore(authStore)
  const signal = useCancellation()
  const currentRuntime = getCurrentRuntime(runtimes)

  // Helpers
  //TODO: does this prevent users from making an .Rmd with the same name as an .ipynb?
  const existingNames = _.map(({ name }) => {
    return getFileName(name)
  }, analyses)

  const loadGoogleAnalyses = async () => {
    const rawAnalyses = await Ajax(signal).Buckets.listAnalyses(googleProject, bucketName)
    const notebooks = _.filter(({ name }) => _.endsWith(`.${tools.Jupyter.ext}`, name), rawAnalyses)
    const rAnalyses = _.filter(({ name }) => _.includes(getExtension(name), tools.RStudio.ext), rawAnalyses)

    //we map the `toolLabel` corresponding header label, which simplifies the table sorting code
    const enhancedNotebooks = _.map(_.set('application', tools.Jupyter.label), notebooks)
    const enhancedRmd = _.map(_.set('application', tools.RStudio.label), rAnalyses)

    const analyses = _.concat(enhancedNotebooks, enhancedRmd)
    setAnalyses(_.reverse(_.sortBy(tableFields.lastModified, analyses)))
  }

  const loadAzureAnalyses = async () => {
    const analyses = await Ajax(signal).AzureStorage.listNotebooks(workspaceId)
    const enhancedAnalyses = _.map(_.set('application', tools.JupyterLab.label), analyses)
    setAnalyses(_.reverse(_.sortBy(tableFields.lastModified, enhancedAnalyses)))
  }

  const refreshAnalyses = _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error loading analyses'),
    Utils.withBusyState(setBusy)
  )(!!googleProject ? loadGoogleAnalyses : loadAzureAnalyses)

  const getActiveFileTransfers = _.flow(
    withErrorReporting('Error loading file transfer status for notebooks in the workspace.'),
    Utils.withBusyState(setBusy)
  )(async () => {
    const fileTransfers = await Ajax(signal).Workspaces.workspace(namespace, workspaceName).listActiveFileTransfers()
    setActiveFileTransfers(!_.isEmpty(fileTransfers))
  })

  const uploadFiles = _.flow(
    withErrorReporting('Error uploading files'),
    Utils.withBusyState(setBusy)
  )(async files => {
    try {
      await Promise.all(_.map(file => {
        const name = file.name
        const toolLabel = getToolFromFileExtension(file.name)
        let resolvedName = name
        let c = 0
        while (_.includes(resolvedName, existingNames)) {
          resolvedName = `${name} ${++c}`
        }
        return !!googleProject ?
          Ajax().Buckets.analysis(googleProject, bucketName, resolvedName, toolLabel).create(file) :
          Ajax(signal).AzureStorage.blob(workspaceId, resolvedName).create(file)
      }, files))
      refreshAnalyses()
    } catch (error) {
      if (error instanceof SyntaxError) {
        reportError('Error uploading analysis', 'This file is not formatted correctly, ensure it has the correct extension')
      } else {
        reportError('Error creating analysis', error)
      }
    }
  })

  // Lifecycle
  useOnMount(_.flow(
    withErrorReporting('Error loading analyses'),
    Utils.withBusyState(setBusy)
  )(async () => {
    const [currentUserHash, potentialLockers] = !!googleProject ?
      await Promise.all([notebookLockHash(bucketName, authState.user.email), findPotentialNotebookLockers({ canShare, namespace, workspaceName, bucketName })]) :
      await Promise.all([Promise.resolve(undefined), Promise.resolve([])])

    setCurrentUserHash(currentUserHash)
    setPotentialLockers(potentialLockers)
    getActiveFileTransfers()
    await refreshAnalyses()
    await refreshRuntimes()
  })
  )

  useEffect(() => {
    StateHistory.update({ analyses, sortOrder, filter })
  }, [analyses, sortOrder, filter])

  const noAnalysisBanner = div([
    div({ style: { fontSize: 48 } }, ['A place for all your analyses ']),
    div({ style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', columnGap: '5rem' } }, _.dropRight(!!googleProject ? 0 : 2, [
      img({ src: jupyterLogo, style: { height: 120, width: 80 }, alt: 'Jupyter' }),
      img({ src: rstudioBioLogo, style: { width: 400 }, alt: 'RStudio Bioconductor' }),
      img({ src: galaxyLogo, style: { height: 60, width: 208 }, alt: 'Galaxy' })
    ])
    ),
    div({ style: { marginTop: '1rem', fontSize: 20 } }, [
      'Click the button above to create an analysis.'
    ])
  ])

  const activeFileTransferMessage = div({
    style: _.merge(
      Style.elements.card.container,
      { backgroundColor: colors.warning(0.15), flexDirection: 'none', justifyContent: 'start', alignItems: 'center' })
  }, [
    icon('warning-standard', { size: 19, style: { color: colors.warning(), flex: 'none', marginRight: '1rem' } }),
    'Copying 1 or more interactive analysis files from another workspace.',
    span({ style: { fontWeight: 'bold', marginLeft: '0.5ch' } }, ['This may take a few minutes.'])
  ])

  // Render helpers
  const renderAnalyses = () => {
    const { field, direction } = sortOrder
    const canWrite = Utils.canWrite(accessLevel)
    const renderedAnalyses = _.flow(
      _.filter(({ name }) => Utils.textMatch(filter, getFileName(name))),
      _.orderBy(sortTokens[field] || field, direction),
      _.map(({ name, lastModified, metadata, application }) => h(AnalysisCard, {
        key: name,
        currentRuntime, name, lastModified, metadata, application, namespace, workspaceName, canWrite, currentUserHash, potentialLockers,
        onRename: () => setRenamingAnalysisName(name),
        onCopy: () => setCopyingAnalysisName(name),
        onExport: () => setExportingAnalysisName(name),
        onDelete: () => setDeletingAnalysisName(name)
      }))
    )(analyses)

    return div({
      style: {
        ..._.merge({ textAlign: 'center', display: 'flex', justifyContent: 'center', padding: '0 1rem 0 1rem' },
          _.isEmpty(analyses) ? { alignItems: 'center', height: '80%' } : { flexDirection: 'column' })
      }
    }, [
      activeFileTransfers && activeFileTransferMessage,
      Utils.cond(
        [_.isEmpty(analyses), () => noAnalysisBanner],
        [!_.isEmpty(analyses) && _.isEmpty(renderedAnalyses), () => {
          return div({ style: { fontStyle: 'italic' } }, ['No matching analyses'])
        }],
        [Utils.DEFAULT, () => h(Fragment, [
          h(AnalysisCardHeaders, {
            sort: sortOrder, onSort: newSortOrder => {
              setLocalPref(KEY_ANALYSES_SORT_ORDER, newSortOrder)
              setSortOrder(newSortOrder)
            }
          }),
          div({ role: 'list', 'aria-label': 'analysis artifacts in workspace', style: { flexGrow: 1, width: '100%' } }, [renderedAnalyses])
        ])]
      )
    ])
  }

  // Render
  return h(Dropzone, {
    accept: `.${runtimeTools.Jupyter.ext.join(', .')}, .${runtimeTools.RStudio.ext.join(', .')}`,
    disabled: !Utils.canWrite(accessLevel),
    style: { flexGrow: 1, backgroundColor: colors.light(), height: '100%' },
    activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
    onDropRejected: () => reportError('Not a valid analysis file',
      `The selected file is not one of the supported types: .${runtimeTools.Jupyter.ext.join(', .')}, .${runtimeTools.RStudio.ext.join(', .')}. Ensure your file has the proper extension.`),
    onDropAccepted: uploadFiles
  }, [({ openUploader }) => h(Fragment, [
    analyses && h(PageBox, { style: { height: '100%', margin: '0px', padding: '3rem' } }, [
      div({ style: { display: 'flex', marginBottom: '1rem' } }, [
        div({ style: { color: colors.dark(), fontSize: 24, fontWeight: 600 } }, ['Your Analyses']),
        h(ButtonOutline, {
          style: { marginLeft: '1.5rem' },
          onClick: () => setCreating(true),
          disabled: !Utils.canWrite(accessLevel),
          tooltip: !Utils.canWrite(accessLevel) ? noWrite : undefined
        }, [
          icon('plus', { size: 14, style: { color: colors.accent() } }),
          div({ style: { marginLeft: '0.5rem' } }, ['Start'])
        ]),
        div({ style: { flex: 1 } }),
        !_.isEmpty(analyses) && h(DelayedSearchInput, {
          'aria-label': 'Search analyses',
          style: { marginRight: '0.75rem', width: 220 },
          placeholder: 'Search analyses',
          onChange: setFilter,
          value: filter
        }),
        h(AnalysisModal, {
          isOpen: creating,
          namespace,
          workspace,
          runtimes,
          persistentDisks,
          refreshRuntimes,
          appDataDisks,
          refreshAnalyses,
          analyses,
          apps,
          refreshApps,
          uploadFiles, openUploader,
          location,
          onDismiss: () => {
            setCreating(false)
          },
          onError: async () => {
            setCreating(false)
            await refreshAnalyses()
            await refreshRuntimes()
            await refreshApps()
          },
          onSuccess: async () => {
            setCreating(false)
            await refreshAnalyses()
            await refreshRuntimes()
            await refreshApps()
          }
        }),
        renamingAnalysisName && h(AnalysisDuplicator, {
          printName: getFileName(renamingAnalysisName),
          toolLabel: getToolFromFileExtension(renamingAnalysisName),
          workspaceInfo: { googleProject, workspaceId, namespace, name: workspaceName, bucketName },
          destroyOld: true,
          fromLauncher: false,
          onDismiss: () => setRenamingAnalysisName(undefined),
          onSuccess: () => {
            setRenamingAnalysisName(undefined)
            refreshAnalyses()
          }
        }),
        copyingAnalysisName && h(AnalysisDuplicator, {
          printName: getFileName(copyingAnalysisName),
          toolLabel: getToolFromFileExtension(copyingAnalysisName),
          workspaceInfo: { googleProject, workspaceId, namespace, name: workspaceName, bucketName },
          destroyOld: false,
          fromLauncher: false,
          onDismiss: () => setCopyingAnalysisName(undefined),
          onSuccess: () => {
            setCopyingAnalysisName(undefined)
            refreshAnalyses()
          }
        }),
        exportingAnalysisName && h(ExportAnalysisModal, {
          printName: getFileName(exportingAnalysisName),
          toolLabel: getToolFromFileExtension(exportingAnalysisName),
          workspace,
          onDismiss: () => setExportingAnalysisName(undefined)
        }),
        deletingAnalysisName && h(DeleteConfirmationModal, {
          objectType: getToolFromFileExtension(deletingAnalysisName) ? `${getToolFromFileExtension(deletingAnalysisName)} analysis` : 'analysis',
          objectName: getFileName(deletingAnalysisName),
          buttonText: 'Delete analysis',
          onConfirm: _.flow(
            Utils.withBusyState(setBusy),
            withErrorReporting('Error deleting analysis.')
          )(async () => {
            setDeletingAnalysisName(undefined)
            if (!!googleProject) {
              await Ajax().Buckets.analysis(
                googleProject,
                bucketName,
                getFileName(deletingAnalysisName),
                getToolFromFileExtension(deletingAnalysisName)
              ).delete()
            } else {
              await Ajax(signal).AzureStorage.blob(workspaceId, getFileName(deletingAnalysisName)).delete()
            }
            refreshAnalyses()
          }),
          onDismiss: () => setDeletingAnalysisName(undefined)
        })
      ]),
      renderAnalyses()
    ]),
    busy && spinnerOverlay
  ])])
})

export const navPaths = [
  {
    name: analysisTabName,
    path: '/workspaces/:namespace/:name/analyses',
    component: Analyses,
    title: ({ name }) => `${name} - Analysis`
  }
]
