import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { CSSProperties, FC, Fragment, useEffect, useState } from 'react'
import { div, h, img, label, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { withViewToggle } from 'src/components/CardsListToggle'
import { ButtonOutline, Clickable, DeleteConfirmationModal, IdContainer, Link, spinnerOverlay, Switch } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { FeaturePreviewFeedbackModal } from 'src/components/FeaturePreviewFeedbackModal'
import { icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import { MenuButton } from 'src/components/MenuButton'
import { PageBox } from 'src/components/PageBox'
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger'
import { ariaSort, HeaderRenderer } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import galaxyLogo from 'src/images/galaxy-logo.svg'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import rstudioBioLogo from 'src/images/r-bio-logo.svg'
import rstudioSquareLogo from 'src/images/rstudio-logo-square.png'
import { Ajax } from 'src/libs/ajax'
import { App } from 'src/libs/ajax/leonardo/models/app-models'
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models'
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews'
import { ENABLE_JUPYTERLAB_ID, JUPYTERLAB_GCP_FEATURE_ID } from 'src/libs/feature-previews-config'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { withHandlers } from 'src/libs/type-utils/lodash-fp-helpers'
import * as Utils from 'src/libs/utils'
import { isAzureWorkspace, isGoogleWorkspace, isGoogleWorkspaceInfo, WorkspaceWrapper } from 'src/libs/workspace-utils'
import { AnalysisDuplicator } from 'src/pages/workspaces/workspace/analysis/modals/AnalysisDuplicator'
import { AnalysisModal } from 'src/pages/workspaces/workspace/analysis/modals/AnalysisModal'
import ExportAnalysisModal from 'src/pages/workspaces/workspace/analysis/modals/ExportAnalysisModal'
import { analysisLauncherTabName, analysisTabName, appLauncherTabName } from 'src/pages/workspaces/workspace/analysis/runtime-common-components'
import { AnalysisFile, useAnalysisFiles } from 'src/pages/workspaces/workspace/analysis/useAnalysisFiles'
import {
  AbsolutePath,
  FileName,
  findPotentialNotebookLockers, getDisplayName,
  getExtension,
  getFileName,
  notebookLockHash
} from 'src/pages/workspaces/workspace/analysis/utils/file-utils'
import { getCurrentRuntime } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'
import {
  getToolLabelFromFileExtension,
  getToolLabelFromRuntime,
  runtimeTools,
  ToolLabel,
  toolLabels,
  tools
} from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'
import { StorageDetails } from 'src/pages/workspaces/workspace/useWorkspace'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const tableFields = {
  application: 'application',
  name: 'name',
  lastModified: 'lastModified'
}

export const KEY_ANALYSES_SORT_ORDER = 'AnalysesSortOrder'

const noWrite = 'You do not have access to modify this workspace.'

const sortTokens = {
  name: (notebook: AnalysisFile) => notebook.name.toLowerCase()
}

const defaultSort = { value: { field: tableFields.lastModified, direction: 'desc' } }

const analysisContextMenuSize = 16
const centerColumnFlex: CSSProperties = { flex: 5 }
const endColumnFlex: CSSProperties = { flex: '0 0 150px', display: 'flex', justifyContent: 'flex-left', whiteSpace: 'nowrap' }

const AnalysisCardHeaders = ({ sort, onSort }) => {
  return div({ role: 'row', style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingLeft: '1.5rem', marginBottom: '0.5rem' } }, [
    div({ role: 'columnheader', 'aria-sort': ariaSort(sort, tableFields.application), style: { flex: 1 } }, [
      h(HeaderRenderer, { sort, onSort, name: tableFields.application })
    ]),
    div({ role: 'columnheader', 'aria-sort': ariaSort(sort, tableFields.name), style: centerColumnFlex }, [
      h(HeaderRenderer, { sort, onSort, name: tableFields.name })
    ]),
    div({ role: 'columnheader', 'aria-sort': ariaSort(sort, tableFields.lastModified), style: { ...endColumnFlex, paddingRight: '1rem' } }, [
      h(HeaderRenderer, { sort, onSort, name: tableFields.lastModified })
    ]),
    div({ role: 'columnheader', style: { flex: `0 0 ${analysisContextMenuSize}px` } }, [
      div({ className: 'sr-only' }, ['Actions'])
    ])
  ])
}

//TODO: move to separate file
const AnalysisCard = ({
  currentRuntime, namespace, name, lastModified, metadata, application, workspaceName, onRename, onCopy, onDelete, onExport, canWrite,
  currentUserHash, potentialLockers
}) => {
  const { lockExpiresAt, lastLockedBy } = metadata || {}
  const isLockExpired: boolean = new Date(parseInt(lockExpiresAt)).getTime() > Date.now()
  const isLocked: boolean = currentUserHash && lastLockedBy && lastLockedBy !== currentUserHash && !isLockExpired
  const lockedBy = potentialLockers ? potentialLockers[lastLockedBy] : null

  const analysisName: FileName = getFileName(name)
  const analysisLink = Nav.getLink(analysisLauncherTabName, { namespace, name: workspaceName, analysisName })
  const toolLabel: ToolLabel = getToolLabelFromFileExtension(name)

  const currentRuntimeToolLabel = getToolLabelFromRuntime(currentRuntime)

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
          disabled: isLocked || !canWrite || currentRuntimeToolLabel === toolLabels.RStudio,
          tooltip: Utils.cond([!canWrite, () => noWrite],
            [currentRuntimeToolLabel === toolLabels.RStudio, () => 'You must have a runtime with Jupyter to edit.']),
          tooltipSide: 'left'
        }, isLocked ? [makeMenuIcon('lock'), 'Open (In Use)'] : [makeMenuIcon('edit'), 'Edit']),
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
          disabled: !canWrite || currentRuntimeToolLabel === toolLabels.Jupyter,
          tooltip: Utils.cond([!canWrite, () => noWrite],
            [currentRuntimeToolLabel === toolLabels.RStudio, () => 'You must have a runtime with RStudio to launch.']),
          tooltipSide: 'left'
        }, [makeMenuIcon('rocket'), 'Open'])
      ]),
      h(MenuButton, {
        'aria-label': 'Copy',
        disabled: !canWrite,
        tooltip: !canWrite ? noWrite : undefined,
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
        tooltip: !canWrite ? noWrite : undefined,
        tooltipSide: 'left',
        onClick: () => onRename()
      }, [makeMenuIcon('renameIcon'), 'Rename']),
      h(MenuButton, {
        'aria-label': 'Delete',
        disabled: !canWrite,
        tooltip: !canWrite ? noWrite : undefined,
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
    onClick: () => Nav.goToPath(analysisLauncherTabName, { namespace, name: workspaceName, analysisName }),
    title: getFileName(name),
    role: 'cell',
    style: {
      ...Style.elements.card.title, whiteSpace: 'normal', textAlign: 'left', cursor: 'pointer', ...centerColumnFlex
    }
  }, [
    getFileName(name)
  ])

  const toolIconSrc: string = Utils.switchCase(application,
    [toolLabels.Jupyter, () => jupyterLogo],
    [toolLabels.RStudio, () => rstudioSquareLogo],
    [toolLabels.JupyterLab, () => jupyterLogo]
  )

  const toolContainer = div({ role: 'cell', style: { display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center' } }, [
    img({ src: toolIconSrc, alt: '', style: { marginRight: '1rem', height: 40, width: 40 } }),
    // this is the tool name, i.e. 'Jupyter'. It is named identical to the header row to simplify the sorting code at the cost of naming consistency.
    application
  ])

  return div({
    role: 'row',
    style: _.merge({
      ...Style.cardList.longCardShadowless
    }, { marginBottom: '.75rem', paddingLeft: '1.5rem' })
  }, [
    toolContainer,
    artifactName,
    div({ role: 'cell', style: { ...endColumnFlex, flexDirection: 'row' } }, [
      div({ style: { flex: 1, display: 'flex' } }, [
        isLocked && h(Clickable, {
          'aria-label': `${artifactName} artifact label`,
          style: { display: 'flex', paddingRight: '1rem', color: colors.dark(0.75) },
          tooltip: `This analysis is currently being edited by ${lockedBy || 'another user'}`
        }, [icon('lock')]),
        h(TooltipTrigger, { content: Utils.makeCompleteDate(lastModified) }, [
          div({ style: { fontSize: '0.8rem', display: 'flex', alignItems: 'center', textAlign: 'left' } }, [
            Utils.makePrettyDate(lastModified)
          ])
        ])
      ]),
    ]),
    div({ role: 'cell', style: { marginLeft: '1rem' } }, [analysisMenu])
  ])
}

const activeFileTransferMessage = div({
  style: _.merge(
    Style.elements.card.container,
    { backgroundColor: colors.warning(0.15), flexDirection: 'none', justifyContent: 'start', alignItems: 'center' })
}, [
  icon('warning-standard', { size: 19, style: { color: colors.warning(), flex: 'none', marginRight: '1rem' } }),
  'Copying 1 or more interactive analysis files from another workspace.',
  span({ style: { fontWeight: 'bold', marginLeft: '0.5ch' } }, ['This may take a few minutes.'])
])

export type DisplayAnalysisFile = AnalysisFile & {
  application: ToolLabel
}

export const decorateAnalysisFiles = (rawAnalyses: AnalysisFile[]): DisplayAnalysisFile[] => {
  const notebooks: AnalysisFile[] = _.filter(({ name }) => _.includes(getExtension(name), runtimeTools.Jupyter.ext), rawAnalyses)
  const rAnalyses: AnalysisFile[] = _.filter(({ name }) => _.includes(getExtension(name), runtimeTools.RStudio.ext), rawAnalyses)

  //we map the `toolLabel` corresponding header label, which simplifies the table sorting code
  const enhancedNotebooks: DisplayAnalysisFile[] = _.map(file => ({ application: tools.Jupyter.label, ...file }), notebooks)
  const enhancedRmd: DisplayAnalysisFile[] = _.map(file => ({ application: tools.RStudio.label, ...file }), rAnalyses)

  const tempAnalyses: DisplayAnalysisFile[] = _.concat(enhancedNotebooks, enhancedRmd)
  return _.reverse(_.sortBy(tableFields.lastModified, tempAnalyses))
}

export const getUniqueFileName = (originalName: string, existingFileNames: FileName[]): FileName => {
  const name: FileName = originalName as FileName
  let resolvedName: FileName = name
  let c = 0
  while (_.includes(resolvedName, existingFileNames)) {
    resolvedName = `${getDisplayName(name)}_${++c}.${getExtension(name)}` as FileName
  }
  return resolvedName
}

export interface AnalysesData {
  apps: App[]
  refreshApps: () => Promise<void>
  runtimes: Runtime[]
  refreshRuntimes: () => Promise<void>
  appDataDisks: PersistentDisk[]
  persistentDisks: PersistentDisk[]
}

export interface AnalysesProps {
  workspace: WorkspaceWrapper
  analysesData: AnalysesData
  onRequesterPaysError: () => void
  storageDetails: StorageDetails
}

export interface SortOrderInfo {
  field: string
  direction: 'asc' | 'desc'
}

export const BaseAnalyses: FC<AnalysesProps> = ({
  workspace,
  analysesData: { apps, refreshApps, runtimes, refreshRuntimes, appDataDisks, persistentDisks },
  storageDetails: { googleBucketLocation, azureContainerRegion },
  onRequesterPaysError
}: AnalysesProps, _ref) => {
  const [renamingAnalysisName, setRenamingAnalysisName] = useState<AbsolutePath>()
  const [copyingAnalysisName, setCopyingAnalysisName] = useState<AbsolutePath>()
  const [deletingAnalysisName, setDeletingAnalysisName] = useState<AbsolutePath>()
  const [exportingAnalysisName, setExportingAnalysisName] = useState<AbsolutePath>()
  const [sortOrder, setSortOrder] = useState<SortOrderInfo>(() => getLocalPref(KEY_ANALYSES_SORT_ORDER) || defaultSort.value)
  const [feedbackShowing, setFeedbackShowing] = useState(false)
  const [filter, setFilter] = useState(() => StateHistory.get().filter || '')
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [analyses, setAnalyses] = useState<DisplayAnalysisFile[]>(() => StateHistory.get().analyses || undefined)
  const [currentUserHash, setCurrentUserHash] = useState<string>()
  const [potentialLockers, setPotentialLockers] = useState()
  const [activeFileTransfers, setActiveFileTransfers] = useState(false)
  const enableJupyterLabPersistenceId: string = `${workspace.workspace.namespace}/${workspace.workspace.name}/${ENABLE_JUPYTERLAB_ID}`
  const [enableJupyterLabGCP, setEnableJupyterLabGCP] = useState<boolean>(() => getLocalPref(enableJupyterLabPersistenceId) || false)

  const authState = useStore(authStore)
  const signal = useCancellation()
  const analysisFileStore = useAnalysisFiles()
  const { loadedState, refreshFileStore, create, deleteFile } = analysisFileStore
  const currentRuntime = getCurrentRuntime(runtimes)
  const location = Utils.cond(
    [isGoogleWorkspace(workspace), () => googleBucketLocation],
    [isAzureWorkspace(workspace), () => azureContainerRegion],
    () => null
  )

  const { accessLevel, workspace: workspaceInfo } = workspace

  const refreshAnalyses: () => Promise<void> = withHandlers([withRequesterPaysHandler(onRequesterPaysError) as any], refreshFileStore)

  const existingFileNames: FileName[] = _.map((analysis: DisplayAnalysisFile) => analysis.fileName, analyses)
  const uploadFiles: (files: File[]) => Promise<unknown> = _.flow(
    withErrorReporting('Error uploading files. Ensure the file has the proper extension'),
    Utils.withBusyState(setBusy)
  )(async (files: File[]) => {
    await Promise.all(_.map(file => {
      const uniqueFileName = getUniqueFileName(file.name, existingFileNames)
      const toolLabel: ToolLabel = getToolLabelFromFileExtension(getExtension(file.name))
      return create(uniqueFileName, toolLabel, file)
    }, files))
  })

  // Lifecycle
  useOnMount(() => {
    const load = _.flow(
      withErrorReporting('Error loading analyses'),
      Utils.withBusyState(setBusy)
    )(async () => {
      const [currentUserHash, potentialLockers]: [string | undefined, any] = isGoogleWorkspace(workspace) ?
        await Promise.all([notebookLockHash(workspace.workspace.bucketName, authState.user.email), findPotentialNotebookLockers(workspace)]) :
        await Promise.all([Promise.resolve(undefined), Promise.resolve([])])

      setCurrentUserHash(currentUserHash)
      setPotentialLockers(potentialLockers)

      const fileTransfers: any[] = await Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).listActiveFileTransfers()
      setActiveFileTransfers(!_.isEmpty(fileTransfers))

      await refreshRuntimes()
    })

    load()
  })

  //We reference the analyses from `useAnalysisStore`, and on change, we decorate them from `AnalysisFile[]` to `DisplayAnalysisFile[]` and update state history
  useEffect(() => {
    const rawAnalyses: AnalysisFile[] = loadedState.status !== 'None' && loadedState.state !== null ? loadedState.state : []
    const decoratedAnalyses = decorateAnalysisFiles(rawAnalyses)
    setAnalyses(decoratedAnalyses)
    StateHistory.update({ analyses: decoratedAnalyses, sortOrder, filter })
  }, [loadedState.status, sortOrder, filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const previewJupyterLabMessage = div({
    style: _.merge(
      Style.elements.card.container,
      { backgroundColor: colors.success(0.15), flexDirection: 'none', alignItems: 'center' })
  }, [
    div({ style: { display: 'flex', flexWrap: 'wrap', whiteSpace: 'pre-wrap', alignItems: 'center' } }, [
      icon('talk-bubble', { size: 19, style: { color: colors.warning(), marginRight: '1rem' } }),
      'JupyterLab is now available in this workspace as a beta feature. Please ',
      h(Link, {
        style: { color: colors.accent(1.25) },
        onClick: () => setFeedbackShowing(true)
      }, ['fill out our survey']),
      ' to help us improve the JupyterLab experience.'
    ]),
    div({ style: { display: 'flex' } }, [
      h(IdContainer, [id => h(Fragment, [
        div({
          style: { display: 'flex', alignItems: 'center' }
        }, [
          label({ htmlFor: id, style: { fontWeight: 'bold', margin: '0 0.5rem', whiteSpace: 'nowrap' } }, ['Enable JupyterLab']),
          h(Switch, {
            // @ts-expect-error
            onLabel: '', offLabel: '',
            onChange: value => {
              setEnableJupyterLabGCP(value)
              setLocalPref(enableJupyterLabPersistenceId, value)
              Ajax().Metrics.captureEvent(Events.analysisToggleJupyterLabGCP, { ...extractWorkspaceDetails(workspaceInfo), enabled: value })
            },
            id,
            checked: enableJupyterLabGCP,
            width: 40, height: 20,
          }, [])
        ])
      ])])
    ])
  ])

  const noAnalysisBanner = div([
    div({ style: { fontSize: 48 } }, ['A place for all your analyses ']),
    div({ style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', columnGap: '5rem' } }, _.dropRight(isGoogleWorkspaceInfo(workspaceInfo) ? 0 : 2, [
      img({ src: jupyterLogo, style: { height: 120, width: 80 }, alt: 'Jupyter' }),
      img({ src: rstudioBioLogo, style: { width: 400 }, alt: 'RStudio Bioconductor' }),
      img({ src: galaxyLogo, style: { height: 60, width: 208 }, alt: 'Galaxy' })
    ])
    ),
    div({ style: { marginTop: '1rem', fontSize: 20 } }, [
      'Click the button above to create an analysis.'
    ])
  ])

  // Render helpers
  const renderAnalyses = () => {
    const { field, direction } = sortOrder
    const canWrite = Utils.canWrite(accessLevel)

    const filteredAnalyses: DisplayAnalysisFile[] = _.filter((analysisFile: DisplayAnalysisFile) => Utils.textMatch(filter, getFileName(analysisFile.name)), analyses)
    // Lodash does not have a well-typed return on this function and there are not any nice alternatives, so expect error for now
    // @ts-expect-error
    const sortedAnalyses: DisplayAnalysisFile[] = _.orderBy(sortTokens[field] || field, direction, filteredAnalyses)
    const analysisCards = _.map(({ name, lastModified, metadata, application }) => h(AnalysisCard, {
      key: name,
      role: 'rowgroup',
      currentRuntime, name, lastModified, metadata, application, namespace: workspaceInfo.namespace, workspaceName: workspaceInfo.name, canWrite, currentUserHash, potentialLockers,
      onRename: () => setRenamingAnalysisName(name),
      onCopy: () => setCopyingAnalysisName(name),
      onExport: () => setExportingAnalysisName(name),
      onDelete: () => setDeletingAnalysisName(name)
    }), sortedAnalyses)


    const basePageStyles: CSSProperties = _.isEmpty(analyses) ? { alignItems: 'center', height: '80%' } : { flexDirection: 'column' }
    return div({
      style: {
        ..._.merge({ textAlign: 'center', display: 'flex', justifyContent: 'center', padding: '0 1rem 0 1rem' },
          basePageStyles)
      }
    }, [
      activeFileTransfers && activeFileTransferMessage,
      feedbackShowing && h(FeaturePreviewFeedbackModal, {
        onDismiss: () => setFeedbackShowing(false),
        onSuccess: () => {
          setFeedbackShowing(false)
        },
        featureName: 'JupyterLab',
        formId: '1FAIpQLScgSqTwp6e2AaVcwkd8mcgseijUjBmRqT7DIyQNjdwz8IT-EA',
        feedbackId: 'entry.760196566',
        contactEmailId: 'entry.11317098',
        sourcePageId: 'entry.1141779347',
        primaryQuestion: 'Please tell us about your experience using JupyterLab',
        sourcePage: 'Analyses List'
      }),
      //Show the JupyterLab preview message only for GCP workspaces, because it's already the default for Azure workspaces
      //It's currently hidden behind a feature preview flag until the supporting documentation/blog post are ready
      isFeaturePreviewEnabled(JUPYTERLAB_GCP_FEATURE_ID) && !_.isEmpty(analyses) && isGoogleWorkspace(workspace) && previewJupyterLabMessage,
      Utils.cond(
        [_.isEmpty(analyses), () => noAnalysisBanner],
        [!_.isEmpty(analyses) && _.isEmpty(analysisCards), () => {
          return div({ style: { fontStyle: 'italic' } }, ['No matching analyses'])
        }],
        [Utils.DEFAULT, () => div({ role: 'table', 'aria-label': 'analyses' }, [
          h(AnalysisCardHeaders, {
            sort: sortOrder, onSort: newSortOrder => {
              setLocalPref(KEY_ANALYSES_SORT_ORDER, newSortOrder)
              setSortOrder(newSortOrder)
            }
          }),
          analysisCards
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
          workspace,
          runtimes,
          persistentDisks,
          refreshRuntimes,
          appDataDisks,
          refreshAnalyses,
          analyses,
          apps,
          refreshApps,
          uploadFiles,
          openUploader,
          location,
          onDismiss: () => {
            setCreating(false)
          },
          onError: () => {
            setCreating(false)
            refreshRuntimes()
            refreshApps()
          },
          onSuccess: () => {
            setCreating(false)
            refreshRuntimes()
            refreshApps()
          },
          analysisFileStore
        }),
        renamingAnalysisName && h(AnalysisDuplicator, {
          printName: getFileName(renamingAnalysisName),
          toolLabel: getToolLabelFromFileExtension(getExtension(renamingAnalysisName)),
          workspaceInfo,
          destroyOld: true,
          fromLauncher: false,
          onDismiss: () => {
            setRenamingAnalysisName(undefined)
            refreshAnalyses()
          },
          onSuccess: () => setRenamingAnalysisName(undefined)
        }),
        copyingAnalysisName && h(AnalysisDuplicator, {
          printName: getFileName(copyingAnalysisName),
          toolLabel: getToolLabelFromFileExtension(getExtension(copyingAnalysisName)),
          workspaceInfo,
          destroyOld: false,
          fromLauncher: false,
          onDismiss: () => setCopyingAnalysisName(undefined),
          onSuccess: () => {
            setCopyingAnalysisName(undefined)
            refreshAnalyses()
          }
        }),
        exportingAnalysisName && h(ExportAnalysisModal, {
          fromLauncher: false,
          printName: getFileName(exportingAnalysisName),
          toolLabel: getToolLabelFromFileExtension(getExtension(exportingAnalysisName)),
          workspace,
          onDismiss: () => setExportingAnalysisName(undefined)
        }),
        deletingAnalysisName && h(DeleteConfirmationModal, {
          objectType: getToolLabelFromFileExtension(getExtension(deletingAnalysisName)) ? `${getToolLabelFromFileExtension(getExtension(deletingAnalysisName))} analysis` : 'analysis',
          objectName: getFileName(deletingAnalysisName),
          buttonText: 'Delete analysis',
          onConfirm: _.flow(
            Utils.withBusyState(setBusy),
            withErrorReporting('Error deleting analysis.')
          )(async () => {
            setDeletingAnalysisName(undefined)
            await deleteFile(deletingAnalysisName)
          }),
          onDismiss: () => setDeletingAnalysisName(undefined)
        })
      ]),
      renderAnalyses()
    ]),
    (loadedState.status === 'Loading' || busy) && spinnerOverlay
  ])])
}

const Analyses = _.flow(
  forwardRefWithName('Analyses'),
  requesterPaysWrapper({
    onDismiss: () => Nav.history.goBack()
  }),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Analyses',
    activeTab: 'analyses',
    topBarContent: null
  }),
  withViewToggle('analysesTab')
)(BaseAnalyses)

export const navPaths = [
  {
    name: analysisTabName,
    path: '/workspaces/:namespace/:name/analyses',
    component: Analyses,
    title: ({ name }) => `${name} - Analysis`
  }
]
