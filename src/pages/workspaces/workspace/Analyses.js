import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useState } from 'react'
import { a, div, h, img, span } from 'react-hyperscript-helpers'
import { AnalysisModal } from 'src/components/AnalysisModal'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { withViewToggle } from 'src/components/CardsListToggle'
import { ButtonOutline, ButtonPrimary, Clickable, DeleteConfirmationModal, HeaderRenderer, Link, PageBox, spinnerOverlay } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import {
  AnalysisDuplicator, findPotentialNotebookLockers, getDisplayName, getFileName, getTool, getToolFromRuntime, notebookLockHash,
  stripExtension, tools
} from 'src/components/notebook-utils'
import { makeMenuIcon, MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { analysisLauncherTabName, analysisTabName, appLauncherTabName } from 'src/components/runtime-common'
import { ariaSort } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import galaxyLogo from 'src/images/galaxy-logo.svg'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import rstudioBioLogo from 'src/images/r-bio-logo.svg'
import rstudioSquareLogo from 'src/images/rstudio-logo-square.png'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { defaultLocation, getCurrentRuntime } from 'src/libs/runtime-utils'
import { authStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { AzureComputeModal } from 'src/pages/workspaces/workspace/analysis/AzureComputeModal'
import ExportAnalysisModal from 'src/pages/workspaces/workspace/notebooks/ExportNotebookModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const noWrite = 'You do not have access to modify this workspace.'

const sortTokens = {
  name: notebook => notebook.name.toLowerCase()
}
const defaultSort = { label: 'Most Recently Updated', value: { field: 'lastModified', direction: 'desc' } }

const analysisContextMenuSize = 16
const centerColumnFlex = { flex: 5 }
const endColumnFlex = { flex: '0 0 150px', display: 'flex', justifyContent: 'flex-left', whiteSpace: 'nowrap' }

const AnalysisCardHeaders = ({ sort, onSort }) => {
  return div({ style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingLeft: '1.5rem', marginBottom: '0.5rem' } }, [
    div({ 'aria-sort': ariaSort(sort, 'Application'), style: { flex: 1 } }, [
      h(HeaderRenderer, { sort, onSort, name: 'application' })
    ]),
    div({ 'aria-sort': ariaSort(sort, 'name'), style: centerColumnFlex }, [
      h(HeaderRenderer, { sort, onSort, name: 'name' })
    ]),
    div({ 'aria-sort': ariaSort(sort, 'lastModified'), style: { ...endColumnFlex, paddingRight: '1rem' } }, [
      h(HeaderRenderer, { sort, onSort, name: 'lastModified' })
    ]),
    div({ style: { flex: `0 0 ${analysisContextMenuSize}px` } }, [
      div({ className: 'sr-only' }, ['Expand'])
    ])
  ])
}

const AnalysisCard = ({
  currentRuntime, namespace, name, lastModified, metadata, application, wsName, onRename, onCopy, onDelete, onExport, canWrite,
  currentUserHash, potentialLockers
}) => {
  const { lockExpiresAt, lastLockedBy } = metadata || {}
  const lockExpirationDate = new Date(parseInt(lockExpiresAt))
  const locked = currentUserHash && lastLockedBy && lastLockedBy !== currentUserHash && lockExpirationDate > Date.now()
  const lockedBy = potentialLockers ? potentialLockers[lastLockedBy] : null

  const analysisLink = Nav.getLink(analysisLauncherTabName, { namespace, name: wsName, analysisName: getFileName(name) })
  const toolLabel = getTool(name)

  const currentRuntimeTool = getToolFromRuntime(currentRuntime)

  const rstudioLaunchLink = Nav.getLink(appLauncherTabName, { namespace, name, application: 'RStudio' })
  const analysisEditLink = `${analysisLink}/?${qs.stringify({ mode: 'edit' })}`
  const analysisPlaygroundLink = `${analysisLink}/?${qs.stringify({ mode: 'playground' })}`

  const analysisMenu = h(MenuTrigger, {
    'aria-label': `Analysis menu`,
    side: 'right',
    closeOnClick: true,
    content: h(Fragment, [
      h(MenuButton, {
        'aria-label': `Preview`,
        href: analysisLink,
        tooltip: canWrite && 'Open without cloud compute',
        tooltipSide: 'left'
      }, [makeMenuIcon('eye'), 'Open preview']),
      ...(toolLabel === tools.Jupyter.label ? [
        h(MenuButton, {
          'aria-label': `Edit`,
          href: analysisEditLink,
          disabled: locked || !canWrite || currentRuntimeTool === tools.RStudio.label,
          tooltip: Utils.cond([!canWrite, () => noWrite],
            [currentRuntimeTool === tools.RStudio.label, () => 'You must have a runtime with Jupyter to edit.']),
          tooltipSide: 'left'
        }, locked ? [makeMenuIcon('lock'), 'Open (In Use)'] : [makeMenuIcon('edit'), 'Edit']),
        h(MenuButton, {
          'aria-label': `Playground`,
          href: analysisPlaygroundLink,
          tooltip: canWrite && 'Open in playground mode',
          tooltipSide: 'left'
        }, [makeMenuIcon('chalkboard'), 'Playground'])
      ] : [
        h(MenuButton, {
          'aria-label': `Launch`,
          href: rstudioLaunchLink,
          disabled: !canWrite || currentRuntimeTool === tools.Jupyter.label,
          tooltip: Utils.cond([!canWrite, () => noWrite],
            [currentRuntimeTool === tools.RStudio.label, () => 'You must have a runtime with RStudio to launch.']),
          tooltipSide: 'left'
        }, [makeMenuIcon('rocket'), 'Open'])
      ]),
      h(MenuButton, {
        'aria-label': `Copy`,
        disabled: !canWrite,
        tooltip: !canWrite && noWrite,
        tooltipSide: 'left',
        onClick: () => onCopy()
      }, [makeMenuIcon('copy'), 'Make a copy']),
      h(MenuButton, {
        'aria-label': `Export`,
        onClick: () => onExport()
      }, [makeMenuIcon('export'), 'Copy to another workspace']),
      h(MenuButton, {
        'aria-label': `Copy`,
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
        'aria-label': `Rename`,
        disabled: !canWrite,
        tooltip: !canWrite && noWrite,
        tooltipSide: 'left',
        onClick: () => onRename()
      }, [makeMenuIcon('renameIcon'), 'Rename']),
      h(MenuButton, {
        'aria-label': `Delete`,
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
    title: getDisplayName(name),
    style: {
      ...Style.elements.card.title, whiteSpace: 'normal', overflowY: 'auto', textAlign: 'left', ...centerColumnFlex
    }
  }, [getDisplayName(name)])

  const toolIconSrc = Utils.switchCase(application,
    [tools.Jupyter.label, () => jupyterLogo],
    [tools.RStudio.label, () => rstudioSquareLogo])

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
  name: wsName, namespace, workspace, workspace: { accessLevel, canShare, workspace: { googleProject, bucketName } },
  analysesData: { apps, refreshApps, runtimes, refreshRuntimes, appDataDisks, persistentDisks },
  onRequesterPaysError
}, _ref) => {
  const [renamingAnalysisName, setRenamingAnalysisName] = useState(undefined)
  const [copyingAnalysisName, setCopyingAnalysisName] = useState(undefined)
  const [deletingAnalysisName, setDeletingAnalysisName] = useState(undefined)
  const [exportingAnalysisName, setExportingAnalysisName] = useState(undefined)
  const [sortOrder, setSortOrder] = useState(() => StateHistory.get().sortOrder || defaultSort.value)
  const [filter, setFilter] = useState(() => StateHistory.get().filter || '')
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [azureCreating, setAzureCreating] = useState(false)
  const [location, setLocation] = useState(defaultLocation)
  const [analyses, setAnalyses] = useState(() => StateHistory.get().analyses || undefined)
  const [currentUserHash, setCurrentUserHash] = useState(undefined)
  const [potentialLockers, setPotentialLockers] = useState(undefined)
  const [activeFileTransfers, setActiveFileTransfers] = useState(false)

  const authState = useStore(authStore)
  const signal = useCancellation()
  const currentRuntime = getCurrentRuntime(runtimes)

  // Helpers
  //TODO: does this prevent users from making an .Rmd with the same name as an .ipynb?
  const existingNames = _.map(({ name }) => getDisplayName(name), analyses)

  //TODO: defined load function for azure
  const refreshAnalyses = !!googleProject ? _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error loading analyses'),
    Utils.withBusyState(setBusy)
  )(async () => {
    const { location } = await Ajax()
      .Workspaces
      .workspace(namespace, workspace.name)
      .checkBucketLocation(googleProject, bucketName)
    setLocation(location)
    const rawAnalyses = await Ajax(signal).Buckets.listAnalyses(googleProject, bucketName)
    const notebooks = _.filter(({ name }) => _.endsWith(`.${tools.Jupyter.ext}`, name), rawAnalyses)
    const rmds = _.filter(({ name }) => _.endsWith(`.${tools.RStudio.ext}`, name), rawAnalyses)

    //we map the `toolLabel` and `updated` fields to their corresponding header label, which simplifies the table sorting code
    const enhancedNotebooks = _.map(notebook => _.merge(notebook, { application: tools.Jupyter.label, lastModified: notebook.updated }), notebooks)
    const enhancedRmd = _.map(rmd => _.merge(rmd, { application: tools.RStudio.label, lastModified: rmd.updated }), rmds)

    const analyses = _.concat(enhancedNotebooks, enhancedRmd)
    setLocation(location)
    setAnalyses(_.reverse(_.sortBy('lastModified', analyses)))
  }) : () => setAnalyses([])

  const getActiveFileTransfers = _.flow(
    withErrorReporting('Error loading file transfer status for notebooks in the workspace.'),
    Utils.withBusyState(setBusy)
  )(async () => {
    const fileTransfers = await Ajax(signal).Workspaces.workspace(namespace, wsName).listActiveFileTransfers()
    setActiveFileTransfers(!_.isEmpty(fileTransfers))
  })

  //TODO: define update function for azure
  const uploadFiles = !!googleProject ? _.flow(
    withErrorReporting('Error uploading files'),
    Utils.withBusyState(setBusy)
  )(async files => {
    try {
      await Promise.all(_.map(async file => {
        const name = stripExtension(file.name)
        const toolLabel = getTool(file.name)
        let resolvedName = name
        let c = 0
        while (_.includes(resolvedName, existingNames)) {
          resolvedName = `${name} ${++c}`
        }
        const contents = await Utils.readFileAsText(file)
        return Ajax().Buckets.analysis(googleProject, bucketName, resolvedName, toolLabel).create(contents)
      }, files))
      refreshAnalyses()
    } catch (error) {
      if (error instanceof SyntaxError) {
        reportError('Error uploading analysis', 'This file is not formatted correctly, ensure it has the correct extension')
      } else {
        reportError('Error creating analysis', error)
      }
    }
  }) : () => {}

  // Lifecycle
  useOnMount(_.flow(
    withErrorReporting('Error loading analyses'),
    Utils.withBusyState(setBusy)
  )(async () => {
    const [currentUserHash, potentialLockers] = !!googleProject ?
      await Promise.all([notebookLockHash(bucketName, authState.user.email), findPotentialNotebookLockers({ canShare, namespace, wsName, bucketName })]) :
      await Promise.all([Promise.resolve(undefined), Promise.resolve(undefined)])
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
      img({ src: jupyterLogo, style: { height: 120, width: 80 } }),
      img({ src: rstudioBioLogo, style: { width: 400 } }),
      div([
        img({ src: galaxyLogo, style: { height: 60, width: 208 } })
      ])
    ])
    ),
    div({ style: { marginTop: '1rem', fontSize: 20 } }, [
      `Click the button above to create an analysis.`
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
      _.filter(({ name }) => Utils.textMatch(filter, getDisplayName(name))),
      _.orderBy(sortTokens[field] || field, direction),
      _.map(({ name, lastModified, metadata, application }) => h(AnalysisCard, {
        key: name,
        currentRuntime, name, lastModified, metadata, application, namespace, wsName, canWrite, currentUserHash, potentialLockers,
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
          h(AnalysisCardHeaders, { sort: sortOrder, onSort: setSortOrder }),
          div({ role: 'list', 'aria-label': 'analysis artifacts in workspace', style: { flexGrow: 1, width: '100%' } }, [renderedAnalyses])
        ])]
      )
    ])
  }

  // Render
  //TODO: enable dropzone for azure when we support file upload
  return h(Dropzone, {
    accept: `.${tools.Jupyter.ext}, .${tools.RStudio.ext}`,
    disabled: !Utils.canWrite(accessLevel) || !googleProject,
    style: { flexGrow: 1, backgroundColor: colors.light(), height: '100%' },
    activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
    onDropRejected: () => reportError('Not a valid analysis file',
      'The selected file is not a .ipynb notebook file or an .Rmd RStudio file. Ensure your file has the proper extension.'),
    onDropAccepted: uploadFiles
  }, [({ openUploader }) => h(Fragment, [
    analyses && h(PageBox, { style: { height: '100%', margin: '0px', padding: '3rem' } }, [
      div({ style: { display: 'flex', marginBottom: '1rem' } }, [
        div({ style: { color: colors.dark(), fontSize: 24, fontWeight: 600 } }, ['Your Analyses']),
        h(ButtonOutline, {
          style: { marginLeft: '1.5rem' },
          //TODO: azure should eventually leverage create modal
          onClick: () => !!googleProject ? setCreating(true) : setAzureCreating(true),
          disabled: !Utils.canWrite(accessLevel),
          tooltip: !Utils.canWrite(accessLevel) ? noWrite : undefined
        }, [
          icon('plus', { size: 14, style: { color: colors.accent() } }),
          div({ style: { marginLeft: '0.5rem' } }, ['Start'])
        ]),
        div({ style: { flex: 1 } }),
        div({
          style: {
            display: 'flex', flexDirection: 'column', padding: '1rem', marginRight: '1rem', width: 275,
            backgroundColor: colors.secondary(0.1), border: `1px solid ${colors.accent()}`, borderRadius: 3
          }, hidden: false
        }, [
          div({ style: { maxWidth: 250 } }, [
            span(['We\'d love to hear your thoughts. ']),
            h(Link, {
              href: 'https://www.surveymonkey.com/r/HBXP537', ...Utils.newTabLinkProps
            }, [
              'Submit feedback'
            ])
          ]),
          h(ButtonPrimary, {
            style: { marginTop: '.5rem', maxWidth: 200, alignSelf: 'center' },
            onClick: () => {
              Ajax().Metrics.captureEvent(Events.analysisDisableBeta, {
                workspaceName: wsName,
                workspaceNamespace: namespace
              })
              window.configOverridesStore.set({ isAnalysisTabVisible: false })
              Nav.goToPath('workspace-notebooks', { namespace, name: wsName })
            },
            tooltip: 'Exit the analysis tab beta feature'
          }, ['Revert layout'])
        ]),
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
          onDismiss: async () => {
            await refreshAnalyses()
            await refreshRuntimes()
            await refreshApps()
            setCreating(false)
          },
          onSuccess: async () => {
            await refreshAnalyses()
            await refreshRuntimes()
            await refreshApps()
            setCreating(false)
          }
        }),
        h(AzureComputeModal, {
          workspace,
          runtimes,
          isOpen: azureCreating,
          onDismiss: async () => {
            await refreshRuntimes()
            setAzureCreating(false)
          },
          onSuccess: async () => {
            await refreshRuntimes()
            setAzureCreating(false)
          }
        }),
        renamingAnalysisName && h(AnalysisDuplicator, {
          printName: getDisplayName(renamingAnalysisName),
          toolLabel: getTool(renamingAnalysisName), googleProject,
          namespace, wsName, bucketName, destroyOld: true,
          onDismiss: () => setRenamingAnalysisName(undefined),
          onSuccess: () => {
            setRenamingAnalysisName(undefined)
            refreshAnalyses()
          }
        }),
        copyingAnalysisName && h(AnalysisDuplicator, {
          printName: getDisplayName(copyingAnalysisName),
          toolLabel: getTool(copyingAnalysisName), googleProject,
          namespace, wsName, bucketName, destroyOld: false,
          onDismiss: () => setCopyingAnalysisName(undefined),
          onSuccess: () => {
            setCopyingAnalysisName(undefined)
            refreshAnalyses()
          }
        }),
        exportingAnalysisName && h(ExportAnalysisModal, {
          printName: getDisplayName(exportingAnalysisName),
          toolLabel: getTool(exportingAnalysisName),
          workspace,
          onDismiss: () => setExportingAnalysisName(undefined)
        }),
        deletingAnalysisName && h(DeleteConfirmationModal, {
          objectType: getTool(deletingAnalysisName) ? `${getTool(deletingAnalysisName)} analysis` : 'analysis',
          objectName: getDisplayName(deletingAnalysisName),
          buttonText: 'Delete analysis',
          onConfirm: _.flow(
            Utils.withBusyState(setBusy),
            withErrorReporting('Error deleting analysis.')
          )(async () => {
            setDeletingAnalysisName(undefined)
            await Ajax().Buckets.analysis(
              googleProject,
              bucketName,
              getDisplayName(deletingAnalysisName),
              getTool(deletingAnalysisName)
            ).delete()
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
