import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useState } from 'react'
import { a, div, h, img } from 'react-hyperscript-helpers'
import { AnalysisModal } from 'src/components/AnalysisModal'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { withViewToggle } from 'src/components/CardsListToggle'
import { ButtonOutline, Clickable, HeaderRenderer, Link, PageBox, spinnerOverlay } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import {
  AnalysisDeleter, AnalysisDuplicator, findPotentialNotebookLockers, getDisplayName, getFileName, getTool, getToolFromRuntime, notebookLockHash,
  stripExtension, tools
} from 'src/components/notebook-utils'
import { makeMenuIcon, MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { analysisLauncherTabName, analysisTabName, appLauncherTabName } from 'src/components/runtime-common'
import { ariaSort } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import galaxyLogo from 'src/images/galaxy-logo.png'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import rstudioBioLogo from 'src/images/r-bio-logo.png'
import rstudioSquareLogo from 'src/images/rstudio-logo-square.png'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { defaultLocation, getCurrentRuntime } from 'src/libs/runtime-utils'
import { authStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
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
        }, locked ? [makeMenuIcon('lock'), 'Edit (In Use)'] : [makeMenuIcon('edit'), 'Edit']),
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
        }, [makeMenuIcon('rocket'), 'Launch'])
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
    activeTab: analysisTabName
  }),
  withViewToggle('analysesTab')
)(({
  apps, name: wsName, namespace, workspace, workspace: { accessLevel, canShare, workspace: { googleProject, bucketName } },
  refreshApps, onRequesterPaysError, runtimes, persistentDisks, refreshRuntimes, appDataDisks
}, ref) => {
  // State
  const [renamingAnalysisName, setRenamingAnalysisName] = useState(undefined)
  const [copyingAnalysisName, setCopyingAnalysisName] = useState(undefined)
  const [deletingAnalysisName, setDeletingAnalysisName] = useState(undefined)
  const [exportingAnalysisName, setExportingAnalysisName] = useState(undefined)
  const [sortOrder, setSortOrder] = useState(() => StateHistory.get().sortOrder || defaultSort.value)
  const [filter, setFilter] = useState(() => StateHistory.get().filter || '')
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [location, setLocation] = useState(defaultLocation)
  //TODO: add galaxy artifacts to this once we have galaxy artifacts
  const [analyses, setAnalyses] = useState(() => StateHistory.get().analyses || undefined)
  const [currentUserHash, setCurrentUserHash] = useState(undefined)
  const [potentialLockers, setPotentialLockers] = useState(undefined)

  const authState = useStore(authStore)
  const signal = useCancellation()
  const currentRuntime = getCurrentRuntime(runtimes)

  // Helpers
  //TODO: does this prevent users from making an .Rmd with the same name as an .ipynb?
  const existingNames = _.map(({ name }) => getDisplayName(name), analyses)

  const refreshAnalyses = _.flow(
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
  })

  const uploadFiles = Utils.withBusyState(setBusy, async files => {
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
  })

  // Lifecycle
  useOnMount(() => {
    const load = async () => {
      const [currentUserHash, potentialLockers] = await Promise.all(
        [notebookLockHash(bucketName, authState.user.email), findPotentialNotebookLockers({ canShare, namespace, wsName, bucketName })])
      setCurrentUserHash(currentUserHash)
      setPotentialLockers(potentialLockers)
      refreshAnalyses()
    }

    load()
  })

  useEffect(() => {
    StateHistory.update({ analyses, sortOrder, filter })
  }, [analyses, sortOrder, filter])

  const noAnalysisBanner = div([
    div({ style: { fontSize: 48 } }, ['A place for all your analyses ']),
    div({ style: { display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' } }, [
      img({ src: jupyterLogo, style: { height: 120, width: 80, marginRight: '5rem' } }),
      img({ src: rstudioBioLogo, style: { width: 406, height: 75, marginRight: '1rem' } }),
      div([
        img({ src: galaxyLogo, style: { height: 60, width: 208 } })
        // span({ style: { marginTop: '3.5rem'} }, ['Galaxy'])
      ])
    ]),
    div({ style: { marginTop: '1rem', fontSize: 20 } }, [
      `Click the button above to create an analysis.`
    ])
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
  return h(Dropzone, {
    accept: `.${tools.Jupyter.ext}, .${tools.RStudio.ext}`,
    disabled: !Utils.canWrite(accessLevel),
    style: { flexGrow: 1, backgroundColor: colors.light(), height: '100%' },
    activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
    onDropRejected: () => reportError('Not a valid analysis file',
      'The selected file is not a .ipynb notebook file or an .Rmd rstudio file. Ensure your file has the proper extension.'),
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
          div({ style: { marginLeft: '0.5rem' } }, ['Create'])
        ]),
        div({ style: { flex: 2 } }),
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
            refreshAnalyses()
            setCreating(false)
          },
          onSuccess: () => {
            refreshAnalyses()
            setCreating(false)
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
        deletingAnalysisName && h(AnalysisDeleter, {
          printName: getDisplayName(deletingAnalysisName), googleProject, bucketName,
          toolLabel: getTool(deletingAnalysisName),
          onDismiss: () => setDeletingAnalysisName(undefined),
          onSuccess: () => {
            setDeletingAnalysisName(undefined)
            refreshAnalyses()
          }
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
