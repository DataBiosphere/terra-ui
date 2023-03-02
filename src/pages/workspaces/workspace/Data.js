import FileSaver from 'file-saver'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { DraggableCore } from 'react-draggable'
import { div, form, h, h3, input, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { ButtonOutline, Clickable, DeleteConfirmationModal, Link, spinnerOverlay } from 'src/components/common'
import { DataTableSaveVersionModal, DataTableVersion, DataTableVersions } from 'src/components/data/data-table-versions'
import {
  EntityUploader, getRootTypeForSetTable, ReferenceDataDeleter, ReferenceDataImporter, renderDataCell
} from 'src/components/data/data-utils'
import EntitiesContent from 'src/components/data/EntitiesContent'
import ExportDataModal from 'src/components/data/ExportDataModal'
import FileBrowser from 'src/components/data/FileBrowser'
import LocalVariablesContent from 'src/components/data/LocalVariablesContent'
import RenameTableModal from 'src/components/data/RenameTableModal'
import { useSavedColumnSettings } from 'src/components/data/SavedColumnSettings'
import WDSContent from 'src/components/data/WDSContent'
import { WdsTroubleshooter } from 'src/components/data/WdsTroubleshooter'
import { icon, spinner } from 'src/components/icons'
import { ConfirmedSearchInput, DelayedSearchInput } from 'src/components/input'
import Interactive from 'src/components/Interactive'
import { MenuButton } from 'src/components/MenuButton'
import { MenuDivider, MenuTrigger } from 'src/components/PopupTrigger'
import { FlexTable, HeaderCell } from 'src/components/table'
import { SnapshotInfo } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { EntityServiceDataTableProvider } from 'src/libs/ajax/data-table-providers/EntityServiceDataTableProvider'
import { resolveWdsUrl, WdsDataTableProvider, wdsProviderName } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { dataTableVersionsPathRoot, useDataTableVersions } from 'src/libs/data-table-versions'
import { reportError, reportErrorAndRethrow, withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { asyncImportJobStore, getUser } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { cloudProviders } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  tableContainer: {
    display: 'flex', flex: 1, flexBasis: '15rem',
    maxHeight: '100%',
    overflow: 'hidden'
  },
  sidebarContainer: {
    overflow: 'auto',
    transition: 'width 100ms'
  },
  dataTypeSelectionPanel: {
    flex: 'none',
    backgroundColor: 'white'
  },
  sidebarSeparator: {
    width: '2px',
    height: '100%',
    cursor: 'ew-resize'
  },
  tableViewPanel: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    flex: 1, display: 'flex', flexDirection: 'column'
  }
}

const SearchResultsPill = ({ filteredCount, searching }) => {
  return div({
    style: {
      width: '5ch', textAlign: 'center', padding: '0.25rem 0rem', fontWeight: 600,
      borderRadius: '1rem', marginRight: '0.5rem', backgroundColor: colors.primary(1.2), color: 'white'
    }
  },
  searching ? [icon('loadingSpinner', { size: 13, color: 'white' })] : `${Utils.truncateInteger(filteredCount)}`)
}

const DataTypeButton = ({ selected, entityName, children, entityCount, iconName = 'listAlt', iconSize = 14, buttonStyle, filteredCount, crossTableSearchInProgress, activeCrossTableTextFilter, after, wrapperProps, ...props }) => {
  const isEntity = entityName !== undefined

  return h(Interactive, {
    ...wrapperProps,
    style: { ...Style.navList.itemContainer(selected), backgroundColor: selected ? colors.dark(0.1) : 'white' },
    hover: Style.navList.itemHover(selected),
    as: 'div'
  }, [
    h(Clickable, {
      style: { ...Style.navList.item(selected), flex: '1 1 auto', minWidth: 0, color: colors.accent(1.2), ...buttonStyle },
      ...(isEntity ? {
        tooltip: entityName ? `${entityName} (${entityCount} row${entityCount === 1 ? '' : 's'}${activeCrossTableTextFilter ? `, ${filteredCount} visible` : ''})` : undefined,
        tooltipDelay: 250,
        useTooltipAsLabel: true
      } : {}),
      'aria-current': selected,
      ...props
    }, [
      activeCrossTableTextFilter && isEntity ?
        SearchResultsPill({ filteredCount, searching: crossTableSearchInProgress }) :
        div({ style: { flex: 'none', width: '1.5rem' } }, [
          icon(iconName, { size: iconSize })
        ]),
      div({ style: { ...Style.noWrapEllipsis } }, [
        entityName || children
      ]),
      isEntity && div({ style: { marginLeft: '1ch' } }, `(${entityCount})`)
    ]),
    after && div({ style: { marginLeft: '1ch' } }, [after])
  ])
}

const DataImportPlaceholder = () => {
  return div({ style: { ...Style.navList.item(false), color: colors.dark(0.7), marginLeft: '0.5rem' } }, [
    div({ style: { flex: 'none', display: 'flex', width: '1.5rem' } }, [
      icon('downloadRegular', { size: 14 })
    ]),
    div({ style: { flex: 1 } }, ['Data import in progress'])
  ])
}

const getReferenceData = _.flow(
  _.toPairs,
  _.filter(([key]) => key.startsWith('referenceData_')),
  _.map(([k, value]) => {
    const [, datum, key] = /referenceData_([^_]+)_(.+)/.exec(k)
    return { datum, key, value }
  }),
  _.groupBy('datum')
)

const ReferenceDataContent = ({ workspace, referenceKey }) => {
  const { workspace: { attributes } } = workspace
  const [textFilter, setTextFilter] = useState('')

  const selectedData = _.flow(
    _.filter(({ key, value }) => Utils.textMatch(textFilter, `${key} ${value}`)),
    _.sortBy('key')
  )(getReferenceData(attributes)[referenceKey])

  return h(Fragment, [
    div({
      style: {
        display: 'flex', justifyContent: 'flex-end',
        padding: '1rem',
        background: colors.light(0.5),
        borderBottom: `1px solid ${colors.grey(0.4)}`
      }
    }, [
      h(DelayedSearchInput, {
        'aria-label': 'Search',
        style: { width: 300 },
        placeholder: 'Search',
        onChange: setTextFilter,
        value: textFilter
      })
    ]),
    div({ style: { flex: 1, margin: '0 0 1rem' } }, [
      h(AutoSizer, [
        ({ width, height }) => h(FlexTable, {
          'aria-label': 'reference data',
          width, height, rowCount: selectedData.length,
          noContentMessage: 'No matching data',
          columns: [
            {
              size: { basis: 400, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Key']),
              cellRenderer: ({ rowIndex }) => renderDataCell(selectedData[rowIndex].key, workspace)
            },
            {
              size: { grow: 1 },
              headerRenderer: () => h(HeaderCell, ['Value']),
              cellRenderer: ({ rowIndex }) => renderDataCell(selectedData[rowIndex].value, workspace)
            }
          ],
          border: false
        })
      ])
    ])
  ])
}
const SnapshotContent = ({ workspace, snapshotDetails, loadMetadata, onUpdate, onDelete, snapshotName, tableName }) => {
  return Utils.cond(
    [!snapshotDetails?.[snapshotName], () => spinnerOverlay],
    [!!tableName, () => h(EntitiesContent, {
      snapshotName,
      workspace,
      entityMetadata: snapshotDetails[snapshotName].entityMetadata,
      setEntityMetadata: () => {},
      entityKey: tableName,
      loadMetadata
    })],
    () => h(SnapshotInfo, { workspace, resource: snapshotDetails[snapshotName].resource, snapshotName, onUpdate, onDelete })
  )
}

const DataTypeSection = ({ title, error, retryFunction, children }) => {
  return h(Collapse, {
    role: 'listitem',
    title: h3({
      style: {
        margin: 0,
        fontSize: 16,
        color: colors.dark(),
        textTransform: 'uppercase'
      }
    }, title),
    titleFirst: true,
    initialOpenState: true,
    summaryStyle: {
      padding: '1.125rem 1.5rem',
      borderBottom: `0.5px solid ${colors.dark(0.2)}`,
      backgroundColor: colors.light(0.4),
      fontSize: 16
    },
    hover: {
      color: colors.dark(0.9)
    },
    afterTitle: error && h(Link, {
      onClick: retryFunction,
      tooltip: 'Error loading, click to retry.'
    }, [icon('sync', { size: 18 })])
  }, [
    !!children?.length && div({
      style: { display: 'flex', flexDirection: 'column', width: '100%' },
      role: 'list'
    }, [children])
  ])
}

const NoDataPlaceholder = ({ message, buttonText, onAdd }) => div({
  style: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    padding: '0.5rem 1.5rem', borderBottom: `1px solid ${colors.dark(0.2)}`,
    backgroundColor: 'white'
  }
}, [
  message,
  h(Link, { style: { marginTop: '0.5rem' }, onClick: onAdd }, [buttonText])
])

const SidebarSeparator = ({ sidebarWidth, setSidebarWidth }) => {
  const minWidth = 280
  const getMaxWidth = useCallback(() => _.clamp(minWidth, 1200, window.innerWidth - 200), [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onDrag = useCallback(_.throttle(100, e => {
    setSidebarWidth(_.clamp(minWidth, getMaxWidth(), e.pageX))
  }), [setSidebarWidth])

  useOnMount(() => {
    const onResize = _.throttle(100, () => {
      setSidebarWidth(_.clamp(minWidth, getMaxWidth()))
    })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  })

  return h(DraggableCore, { onDrag }, [
    h(Interactive, {
      as: 'div',
      role: 'separator',
      'aria-label': 'Resize sidebar',
      'aria-valuenow': sidebarWidth,
      'aria-valuemin': minWidth,
      'aria-valuemax': getMaxWidth(),
      tabIndex: 0,
      className: 'custom-focus-style',
      style: {
        ...styles.sidebarSeparator,
        background: colors.grey(0.4)
      },
      hover: {
        background: colors.accent(1.2)
      },
      onKeyDown: e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          setSidebarWidth(w => _.min([w + 10, getMaxWidth()]))
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          setSidebarWidth(w => _.max([w - 10, minWidth]))
        }
      }
    })
  ])
}

const DataTableActions = ({ workspace, tableName, rowCount, entityMetadata, onRenameTable, onDeleteTable, isShowingVersionHistory, onSaveVersion, onToggleVersionHistory, dataProvider }) => {
  const { workspace: { namespace, name }, workspaceSubmissionStats: { runningSubmissionsCount } } = workspace

  const isSet = tableName.endsWith('_set')
  const isSetOfSets = tableName.endsWith('_set_set')
  const setTableNames = _.filter(v => v.match(`${tableName}(_set)+$`), _.keys(entityMetadata))

  const editWorkspaceErrorMessage = Utils.editWorkspaceError(workspace)

  const downloadForm = useRef()
  const signal = useCancellation()

  const [loading, setLoading] = useState(false)
  const [entities, setEntities] = useState([])
  const [exporting, setExporting] = useState(false)
  const [savingVersion, setSavingVersion] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    getAllSavedColumnSettings,
    updateAllSavedColumnSettings
  } = useSavedColumnSettings({ workspaceId: { namespace, name }, entityType: tableName, entityMetadata })

  return h(Fragment, [
    h(MenuTrigger, {
      side: 'bottom',
      closeOnClick: true,
      content: h(Fragment, [
        form({
          ref: downloadForm,
          action: `${getConfig().orchestrationUrlRoot}/cookie-authed/workspaces/${namespace}/${name}/entities/${tableName}/tsv`,
          method: 'POST'
        }, [
          input({ type: 'hidden', name: 'FCtoken', value: getUser().token }),
          input({ type: 'hidden', name: 'model', value: 'flexible' })
        ]),
        (dataProvider.features.supportsTsvDownload || dataProvider.features.supportsTsvAjaxDownload) && h(MenuButton, {
          disabled: isSetOfSets,
          tooltip: isSetOfSets ?
            'Downloading sets of sets as TSV is not supported at this time.' :
            'Download a TSV file containing all rows in this table.',
          onClick: () => {
            if (dataProvider.features.supportsTsvDownload) {
              downloadForm.current.submit()
            } else if (dataProvider.features.supportsTsvAjaxDownload) {
              // TODO: this overrides the filename specified by the WDS API. Is that ok?
              dataProvider.downloadTsv(signal, tableName).then(blob => FileSaver.saveAs(blob, `${tableName}.tsv`))
            }
            Ajax().Metrics.captureEvent(Events.workspaceDataDownload, {
              ...extractWorkspaceDetails(workspace.workspace),
              providerName: dataProvider.providerName,
              cloudPlatform: dataProvider.providerName === wdsProviderName ? cloudProviders.azure.label : cloudProviders.gcp.label,
              downloadFrom: 'all rows',
              fileType: '.tsv'
            })
          }
        }, 'Download TSV'),
        dataProvider.features.supportsExport && h(MenuButton, {
          onClick: _.flow(
            Utils.withBusyState(setLoading),
            withErrorReporting('Error loading entities.')
          )(async () => {
            const queryResults = await Ajax(signal).Workspaces.workspace(namespace, name).paginatedEntitiesOfType(tableName, { pageSize: rowCount })
            setEntities(_.map(_.get('name'), queryResults.results))
            setExporting(true)
          })
        }, 'Export to workspace'),
        dataProvider.features.supportsTypeRenaming && h(MenuButton, {
          onClick: () => {
            setRenaming(true)
          },
          disabled: !!editWorkspaceErrorMessage,
          tooltip: editWorkspaceErrorMessage || ''
        }, 'Rename table'),
        dataProvider.features.supportsTypeDeletion && h(MenuButton, {
          onClick: () => setDeleting(true),
          disabled: !!editWorkspaceErrorMessage,
          tooltip: editWorkspaceErrorMessage || ''
        }, 'Delete table'),
        isFeaturePreviewEnabled('data-table-versioning') && h(Fragment, [
          h(MenuDivider),
          h(MenuButton, { onClick: () => setSavingVersion(true) }, ['Save version']),
          h(MenuButton, {
            onClick: () => {
              onToggleVersionHistory(!isShowingVersionHistory)
              if (!isShowingVersionHistory) {
                Ajax().Metrics.captureEvent(Events.dataTableVersioningViewVersionHistory, {
                  ...extractWorkspaceDetails(workspace.workspace),
                  tableName
                })
              }
            }
          }, [`${isShowingVersionHistory ? 'Hide' : 'Show'} version history`])
        ])
      ])
    }, [
      h(Clickable, {
        disabled: loading,
        tooltip: 'Table menu',
        useTooltipAsLabel: true
      }, [icon(loading ? 'loadingSpinner' : 'cardMenuIcon')])
    ]),
    exporting && h(ExportDataModal, {
      onDismiss: () => {
        setExporting(false)
        setEntities([])
      },
      workspace,
      selectedDataType: tableName,
      selectedEntities: entities,
      runningSubmissionsCount
    }),
    savingVersion && h(DataTableSaveVersionModal, {
      workspace,
      entityType: isSet ? getRootTypeForSetTable(tableName) : tableName,
      allEntityTypes: _.keys(entityMetadata),
      includeSetsByDefault: isSet,
      onDismiss: () => setSavingVersion(false),
      onSubmit: versionOpts => {
        setSavingVersion(false)
        onSaveVersion(versionOpts)
      }
    }),
    renaming && h(RenameTableModal, {
      onDismiss: () => setRenaming(false),
      onUpdateSuccess: onRenameTable,
      getAllSavedColumnSettings,
      updateAllSavedColumnSettings,
      setTableNames,
      namespace, name,
      selectedDataType: tableName,
      entityMetadata
    }),
    deleting && h(DeleteConfirmationModal, {
      objectType: 'table',
      objectName: tableName,
      onDismiss: () => setDeleting(false),
      onConfirm: Utils.withBusyState(setLoading)(async () => {
        try {
          await dataProvider.deleteTable(tableName)
          Ajax().Metrics.captureEvent(Events.workspaceDataDeleteTable, {
            ...extractWorkspaceDetails(workspace.workspace),
            providerName: dataProvider.providerName,
            cloudPlatform: dataProvider.providerName === wdsProviderName ? cloudProviders.azure.label : cloudProviders.gcp.label
          })
          setDeleting(false)
          onDeleteTable(tableName)
        } catch (error) {
          setDeleting(false)
          if (error.status === 409) {
            notify('warn', 'Unable to delete table', {
              message: 'In order to delete this table, any entries in other tables that reference it must also be deleted.'
            })
          } else {
            reportError('Error deleting table', error)
          }
        }
      })
    })
  ])
}

const DataTableFeaturePreviewFeedbackBanner = () => {
  const isDataTableProvenanceEnabled = isFeaturePreviewEnabled('data-table-provenance')
  const isDataTableVersioningEnabled = isFeaturePreviewEnabled('data-table-versioning')

  const label = _.join(' and ', _.compact([
    isDataTableVersioningEnabled && 'versioning',
    isDataTableProvenanceEnabled && 'provenance'
  ]))
  const feedbackUrl = `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent(`Feedback on data table ${label}`)}`

  return (isDataTableProvenanceEnabled || isDataTableVersioningEnabled) && div({
    style: {
      padding: '1rem',
      borderBottom: `1px solid ${colors.accent()}`,
      background: '#fff',
      textAlign: 'center'
    }
  }, [h(Link, { ...Utils.newTabLinkProps, href: feedbackUrl }, [`Provide feedback on data table ${label}`])])
}

const workspaceDataTypes = Utils.enumify(['entities', 'entitiesVersion', 'snapshot', 'referenceData', 'localVariables', 'bucketObjects', 'wds'])

const WorkspaceData = _.flow(
  forwardRefWithName('WorkspaceData'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Data', activeTab: 'data'
  })
)(({ namespace, name, workspace, workspace: { workspace: { createdBy, googleProject, attributes, workspaceId } }, refreshWorkspace }, ref) => {
  // State
  const [refreshKey, setRefreshKey] = useState(0)
  const forceRefresh = () => setRefreshKey(_.add(1))
  const [selectedData, setSelectedData] = useState(() => StateHistory.get().selectedData)
  const [entityMetadata, setEntityMetadata] = useState(() => StateHistory.get().entityMetadata)
  const [snapshotDetails, setSnapshotDetails] = useState(() => StateHistory.get().snapshotDetails)
  const [importingReference, setImportingReference] = useState(false)
  const [deletingReference, setDeletingReference] = useState(undefined)
  const [troubleshootingWds, setTroubleshootingWds] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingWDSFile, setUploadingWDSFile] = useState(false)
  const [entityMetadataError, setEntityMetadataError] = useState()
  const [snapshotMetadataError, setSnapshotMetadataError] = useState()
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [activeCrossTableTextFilter, setActiveCrossTableTextFilter] = useState('')
  const [crossTableResultCounts, setCrossTableResultCounts] = useState({})
  const [crossTableSearchInProgress, setCrossTableSearchInProgress] = useState(false)
  const [showDataTableVersionHistory, setShowDataTableVersionHistory] = useState({}) // { [entityType: string]: boolean }
  const pollWdsInterval = useRef()

  const [wdsProxyUrl, setWdsProxyUrl] = useState({ status: 'None', state: '' })
  const [wdsTypes, setWdsTypes] = useState({ status: 'None', state: [] })

  const { dataTableVersions, loadDataTableVersions, saveDataTableVersion, deleteDataTableVersion, importDataTableVersion } = useDataTableVersions(workspace)

  const isGoogleWorkspace = !!googleProject
  const isAzureWorkspace = !isGoogleWorkspace

  const signal = useCancellation()
  const asyncImportJobs = useStore(asyncImportJobStore)

  const entityServiceDataTableProvider = new EntityServiceDataTableProvider(namespace, name)

  // auto-deploy WDS for a user who is: 1) the workspace creator, and 2) still an OWNER of the workspace
  // disablied: const shouldAutoDeployWds = workspace?.accessLevel === 'OWNER' && createdBy === getUser()?.email

  const wdsDataTableProvider = useMemo(() => {
    const proxyUrl = !!wdsProxyUrl && wdsProxyUrl.state
    return new WdsDataTableProvider(workspaceId, proxyUrl)
  }, [workspaceId, wdsProxyUrl])


  const loadEntityMetadata = async () => {
    try {
      setEntityMetadata(undefined)
      setEntityMetadataError(false)
      const entityMetadata = await Ajax(signal).Workspaces.workspace(namespace, name).entityMetadata()

      if (selectedData?.type === workspaceDataTypes.entities && !entityMetadata[selectedData.entityType]) {
        setSelectedData(undefined)
      }
      setEntityMetadata(entityMetadata)
    } catch (error) {
      reportError('Error loading workspace entity data', error)
      setEntityMetadataError(true)
      setSelectedData(undefined)
      setEntityMetadata({})
    }
  }

  const loadSnapshotMetadata = async () => {
    try {
      setSnapshotMetadataError(false)
      const { gcpDataRepoSnapshots: snapshotBody } = await Ajax(signal).Workspaces.workspace(namespace, name).listSnapshots(1000, 0)

      const snapshots = _.reduce((acc, { metadata: { name, ...metadata }, attributes }) => {
        return _.set([name, 'resource'], _.merge(metadata, attributes), acc)
      },
      _.pick(_.map('name', _.map('metadata', snapshotBody)), snapshotDetails) || {}, // retain entities if loaded from state history, but only for snapshots that exist
      snapshotBody)

      setSnapshotDetails(snapshots)
    } catch (error) {
      reportError('Error loading workspace snapshot data', error)
      setSnapshotMetadataError(true)
      setSelectedData(undefined)
      setSnapshotDetails({})
    }
  }

  const loadMetadata = () => Promise.all([loadEntityMetadata(), loadSnapshotMetadata(), getRunningImportJobs(), loadWdsSchema()])

  const loadSnapshotEntities = async snapshotName => {
    try {
      setSnapshotDetails(_.set([snapshotName, 'error'], false))
      const entities = await Ajax(signal).Workspaces.workspace(namespace, name).snapshotEntityMetadata(googleProject, snapshotName)
      //Prevent duplicate id columns
      const entitiesWithoutIds = _.mapValues(entity => _.update(['attributeNames'], _.without([entity.idName]), entity), entities)
      setSnapshotDetails(_.set([snapshotName, 'entityMetadata'], entitiesWithoutIds))
    } catch (error) {
      reportError(`Error loading entities in snapshot ${snapshotName}`, error)
      setSnapshotDetails(_.set([snapshotName, 'error'], true))
    }
  }

  const loadWdsSchema = async () => {
    // Initial attempt to load WDS data when the user arrives on the data page
    if (isAzureWorkspace) {
      await loadWdsData()
    }
  }

  const loadWdsUrl = useCallback(workspaceId => {
    //setWdsProxyUrl({ status: 'Loading', state: '' })
    return Ajax().Apps.listAppsV2(workspaceId).then(resolveWdsUrl)
      .then(url => {
        if (!!url) {
          setWdsProxyUrl({ status: 'Ready', state: url })
        }
        return url
      })
      .catch(err => {
        setWdsProxyUrl({ status: 'Error', state: err })
        return ''
      })
  }, [])

  const loadWdsTypes = useCallback((url, workspaceId) => {
    return Ajax(signal).WorkspaceData.getSchema(url, workspaceId)
      .then(typesResult => {
        setWdsTypes({ status: 'Ready', state: typesResult })
      })
      .catch(err => {
        setWdsTypes({ status: 'Error', state: err })
      })
  }, [signal])

  const loadWdsData = useCallback(async () => {
    try {
      // Try to load the proxy URL
      if (!wdsProxyUrl || (wdsProxyUrl.status !== 'Ready')) {
        const wdsUrl = await loadWdsUrl(workspaceId)
        if (!!wdsUrl) {
          await loadWdsTypes(wdsUrl, workspaceId)
        }
      } else {
        // If we have the proxy URL try to load the WDS types
        const proxyUrl = wdsProxyUrl.state
        await loadWdsTypes(proxyUrl, workspaceId)
      }
    } catch (error) {
      console.log(`Error thrown loading WDS schema: ${error}`) // eslint-disable-line no-console
    }
  }, [loadWdsUrl, loadWdsTypes, workspaceId, wdsProxyUrl])

  useEffect(() => {
    if (isAzureWorkspace) {
      // Start polling if we're missing WDS Types, and stop polling when we have them.
      if ((!wdsTypes || (wdsTypes.status !== 'Ready')) && !pollWdsInterval.current) {
        pollWdsInterval.current = setInterval(loadWdsData, 30 * 1000)
      } else if (!!wdsTypes && wdsTypes.status === 'Ready' && pollWdsInterval.current) {
        clearInterval(pollWdsInterval.current)
        pollWdsInterval.current = undefined
      }
    }

    return () => {
      clearInterval(pollWdsInterval.current)
      pollWdsInterval.current = undefined
    }
  }, [loadWdsData, workspaceId, wdsProxyUrl, wdsTypes, isAzureWorkspace])

  const toSortedPairs = _.flow(_.toPairs, _.sortBy(_.first))

  const getRunningImportJobs = async () => {
    try {
      const runningJobs = await Ajax(signal).Workspaces.workspace(namespace, name).listImportJobs(true)
      const currentJobIds = _.map('jobId', asyncImportJobStore.get())
      _.forEach(job => {
        const jobStatus = _.lowerCase(job.status)
        if (!_.includes(jobStatus, ['success', 'error', 'done']) && !_.includes(job.jobId, currentJobIds)) {
          asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId: job.jobId }))
        }
      }, runningJobs)
    } catch (error) {
      reportError('Error loading running import jobs in this workspace')
    }
  }

  const deleteColumnUpdateMetadata = ({ attributeName, entityType }) => {
    const newArray = _.get(entityType, entityMetadata).attributeNames
    const attributeNamesArrayUpdated = _.without([attributeName], newArray)
    const updatedMetadata = _.set([entityType, 'attributeNames'], attributeNamesArrayUpdated, entityMetadata)
    setEntityMetadata(updatedMetadata)
  }

  const searchAcrossTables = async (typeNames, activeCrossTableTextFilter) => {
    setCrossTableSearchInProgress(true)
    try {
      const results = await Promise.all(_.map(async typeName => {
        const { resultMetadata: { filteredCount } } = await Ajax(signal).Workspaces.workspace(namespace, name).paginatedEntitiesOfType(typeName, { pageSize: 1, filterTerms: activeCrossTableTextFilter })
        return { typeName, filteredCount }
      }, typeNames))
      setCrossTableResultCounts(results)
      Ajax().Metrics.captureEvent(Events.workspaceDataCrossTableSearch, {
        ...extractWorkspaceDetails(workspace.workspace),
        numTables: _.size(typeNames)
      })
    } catch (error) {
      reportError('Error searching across tables', error)
    }
    setCrossTableSearchInProgress(false)
  }

  // Lifecycle
  useOnMount(() => {
    loadMetadata()
  })

  useEffect(() => {
    StateHistory.update({ entityMetadata, selectedData, snapshotDetails })
  }, [entityMetadata, selectedData, snapshotDetails])

  useImperativeHandle(ref, () => ({
    refresh: () => {
      forceRefresh()
      loadMetadata()
    }
  }))


  // Render
  const referenceData = getReferenceData(attributes)
  const sortedEntityPairs = toSortedPairs(entityMetadata)
  const sortedSnapshotPairs = toSortedPairs(snapshotDetails)

  const editWorkspaceErrorMessage = Utils.editWorkspaceError(workspace)
  const canEditWorkspace = !editWorkspaceErrorMessage

  // convenience vars for WDS
  const wdsReady = wdsProxyUrl.status === 'Ready' && wdsTypes.status === 'Ready'
  const wdsLoading = wdsProxyUrl.status === 'Loading' || wdsTypes.status === 'Loading'
  const wdsError = wdsProxyUrl.status === 'Error' || wdsTypes.status === 'Error'

  const canUploadTsv = isGoogleWorkspace || (isAzureWorkspace && wdsReady)
  return div({ style: styles.tableContainer }, [
    !entityMetadata ? spinnerOverlay : h(Fragment, [
      div({ style: { ...styles.sidebarContainer, width: sidebarWidth } }, [
        canUploadTsv && div({
          style: {
            display: 'flex', padding: '1rem 1.5rem',
            backgroundColor: colors.light(),
            borderBottom: `1px solid ${colors.grey(0.4)}`
          }
        }, [
          h(MenuTrigger, {
            side: 'bottom',
            closeOnClick: true,
            // Make the width of the dropdown menu match the width of the button.
            popupProps: { style: { width: `calc(${sidebarWidth}px - 3rem` } },
            content: h(Fragment, [
              h(MenuButton, {
                'aria-haspopup': 'dialog',
                onClick: () => isGoogleWorkspace ? setUploadingFile(true) : setUploadingWDSFile(true)
              }, 'Upload TSV'),
              isGoogleWorkspace && h(MenuButton, {
                href: `${Nav.getLink('upload')}?${qs.stringify({ workspace: workspaceId })}`
              }, ['Open data uploader']),
              isGoogleWorkspace && h(MenuButton, {
                'aria-haspopup': 'dialog',
                onClick: () => setImportingReference(true)
              }, 'Add reference data')
            ])
          }, [h(ButtonOutline, {
            disabled: !canEditWorkspace || uploadingWDSFile,
            tooltip: Utils.cond([uploadingWDSFile, 'Upload in progress'], canEditWorkspace ? 'Add data to this workspace' : editWorkspaceErrorMessage),
            style: { flex: 1 }
          }, [span([icon('plus-circle', { style: { marginRight: '1ch' } }), 'Import data'])])])
        ]),
        div({ style: styles.dataTypeSelectionPanel, role: 'navigation', 'aria-label': 'data in this workspace' }, [
          div({ role: 'list' }, [
            isGoogleWorkspace && h(DataTypeSection, {
              title: 'Tables',
              error: entityMetadataError,
              retryFunction: loadEntityMetadata
            }, [
              _.some({ targetWorkspace: { namespace, name } }, asyncImportJobs) && h(DataImportPlaceholder),
              !_.some({ targetWorkspace: { namespace, name } }, asyncImportJobs) && _.isEmpty(sortedEntityPairs) && h(NoDataPlaceholder, {
                message: 'No tables have been uploaded.',
                buttonText: 'Upload TSV',
                onAdd: () => setUploadingFile(true)
              }),
              !_.isEmpty(sortedEntityPairs) && div({ style: { margin: '1rem' } }, [
                h(ConfirmedSearchInput, {
                  'aria-label': 'Search all tables',
                  placeholder: 'Search all tables',
                  onChange: activeCrossTableTextFilter => {
                    setActiveCrossTableTextFilter(activeCrossTableTextFilter)
                    searchAcrossTables(_.keys(entityMetadata), activeCrossTableTextFilter)
                  },
                  defaultValue: activeCrossTableTextFilter
                })
              ]),
              activeCrossTableTextFilter !== '' && div({ style: { margin: '0rem 1rem 1rem 1rem' } },
                crossTableSearchInProgress ?
                  ['Loading...', icon('loadingSpinner', { size: 13, color: colors.primary() })] :
                  [`${_.sum(_.map(c => c.filteredCount, crossTableResultCounts))} results`]),
              _.map(([type, typeDetails]) => {
                const isShowingVersionHistory = !!showDataTableVersionHistory[type]
                return div({ key: type, role: 'listitem' }, [
                  h(DataTypeButton, {
                    key: type,
                    selected: selectedData?.type === workspaceDataTypes.entities && selectedData.entityType === type,
                    entityName: type,
                    entityCount: typeDetails.count,
                    filteredCount: _.find({ typeName: type }, crossTableResultCounts)?.filteredCount,
                    activeCrossTableTextFilter,
                    crossTableSearchInProgress,
                    onClick: () => {
                      setSelectedData({ type: workspaceDataTypes.entities, entityType: type })
                      forceRefresh()
                    },
                    after: h(DataTableActions, {
                      dataProvider: entityServiceDataTableProvider,
                      tableName: type,
                      rowCount: typeDetails.count,
                      entityMetadata,
                      workspace,
                      onRenameTable: () => loadMetadata(),
                      onDeleteTable: tableName => {
                        setSelectedData(undefined)
                        setEntityMetadata(_.unset(tableName))
                      },
                      isShowingVersionHistory,
                      onSaveVersion: withErrorReporting('Error saving version', versionOpts => {
                        setShowDataTableVersionHistory(_.set(type, true))
                        return saveDataTableVersion(type, versionOpts)
                      }),
                      onToggleVersionHistory: withErrorReporting('Error loading version history', showVersionHistory => {
                        setShowDataTableVersionHistory(_.set(type, showVersionHistory))
                        if (showVersionHistory) {
                          loadDataTableVersions(type.endsWith('_set') ? getRootTypeForSetTable(type) : type)
                        }
                      })
                    })
                  }),
                  isShowingVersionHistory && h(DataTableVersions, {
                    ...Utils.cond(
                      [type.endsWith('_set'), () => {
                        const referencedType = getRootTypeForSetTable(type)
                        return _.update(
                          'versions',
                          _.filter(version => _.includes(type, version.includedSetEntityTypes)),
                          dataTableVersions[referencedType]
                        )
                      }],
                      () => dataTableVersions[type]
                    ),
                    onClickVersion: version => setSelectedData({ type: workspaceDataTypes.entitiesVersion, version })
                  })
                ])
              }, sortedEntityPairs)
            ]),
            troubleshootingWds && h(WdsTroubleshooter, {
              onDismiss: () => setTroubleshootingWds(false),
              workspaceId,
              mrgId: workspace.azureContext.managedResourceGroupId
            }),
            isAzureWorkspace && uploadingWDSFile && h(DataImportPlaceholder),
            isAzureWorkspace && h(DataTypeSection, {
              title: 'Tables'
            }, [
              (wdsLoading || wdsError) && h(NoDataPlaceholder, {
                message: wdsLoading ? icon('loadingSpinner') : 'Data tables are unavailable'
              }),
              wdsReady && _.isEmpty(wdsTypes.state) && h(NoDataPlaceholder, {
                message: 'No tables have been uploaded.'
              }),
              wdsReady && !_.isEmpty(wdsTypes.state) && _.map(typeDef => {
                return div({ key: typeDef.name, role: 'listitem' }, [
                  h(DataTypeButton, {
                    key: typeDef.name,
                    selected: selectedData?.type === workspaceDataTypes.wds && selectedData.entityType === typeDef.name,
                    entityName: typeDef.name,
                    entityCount: typeDef.count,
                    filteredCount: typeDef.count,
                    activeCrossTableTextFilter: false,
                    crossTableSearchInProgress: false,
                    onClick: () => {
                      setSelectedData({ type: workspaceDataTypes.wds, entityType: typeDef.name })
                      forceRefresh()
                    },
                    after: h(DataTableActions, {
                      dataProvider: wdsDataTableProvider,
                      tableName: typeDef.name,
                      rowCount: typeDef.count,
                      entityMetadata,
                      workspace,
                      onRenameTable: undefined,
                      onDeleteTable: tableName => {
                        setSelectedData(undefined)
                        setWdsTypes({ status: 'Ready', state: _.remove(typeDef => typeDef.name === tableName, wdsTypes.state) })
                        forceRefresh()
                      },
                      isShowingVersionHistory: false,
                      onSaveVersion: undefined,
                      onToggleVersionHistory: undefined
                    })
                  })
                ])
              }, wdsTypes.state),
              h(NoDataPlaceholder, {
                buttonText: 'Data Table Status',
                onAdd: () => setTroubleshootingWds(true)
              }),
            ]),
            (!_.isEmpty(sortedSnapshotPairs) || snapshotMetadataError) && isGoogleWorkspace && h(DataTypeSection, {
              title: 'Snapshots',
              error: snapshotMetadataError,
              retryFunction: loadSnapshotMetadata
            }, [
              _.map(([snapshotName, { resource: { resourceId, snapshotId }, entityMetadata: snapshotTables, error: snapshotTablesError }]) => {
                const snapshotTablePairs = toSortedPairs(snapshotTables)
                return h(Collapse, {
                  key: snapshotName,
                  titleFirst: true,
                  noTitleWrap: true,
                  summaryStyle: { height: 50, paddingRight: '0.5rem', fontWeight: 600 },
                  tooltip: snapshotName,
                  tooltipDelay: 250,
                  style: { fontSize: 14, paddingLeft: '1.5rem', borderBottom: `1px solid ${colors.dark(0.2)}` },
                  title: snapshotName,
                  role: 'listitem',
                  afterTitle: h(Link, {
                    style: { marginLeft: 'auto' },
                    tooltip: 'Snapshot Info',
                    onClick: () => {
                      setSelectedData({ type: workspaceDataTypes.snapshot, snapshotName })
                      forceRefresh()
                    }
                  }, [icon(`info-circle${selectedData?.type === workspaceDataTypes.snapshot && selectedData.snapshotName === snapshotName ? '' : '-regular'}`, { size: 20 })]),
                  initialOpenState: selectedData?.type === workspaceDataTypes.snapshot && selectedData.snapshotName === snapshotName,
                  onFirstOpen: () => loadSnapshotEntities(snapshotName)
                }, [Utils.cond(
                  [snapshotTablesError, () => div({
                    style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }
                  }, [
                    'Failed to load tables',
                    h(Link, {
                      onClick: () => loadSnapshotEntities(snapshotName),
                      tooltip: 'Error loading, click to retry.'
                    }, [icon('sync', { size: 24, style: { marginLeft: '1rem' } })])
                  ])],
                  [snapshotTables === undefined, () => div({
                    style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }
                  }, [
                    'Loading snapshot contents...',
                    spinner({ style: { marginLeft: '1rem' } })
                  ])],
                  () => div({ role: 'list', style: { fontSize: 14, lineHeight: '1.5' } }, [
                    _.map(([tableName, { count }]) => {
                      const canCompute = !!(workspace?.canCompute)
                      return h(DataTypeButton, {
                        wrapperProps: { role: 'listitem' },
                        buttonStyle: { borderBottom: 0, height: 40, ...(canCompute ? {} : { color: colors.dark(0.25) }) },
                        tooltip: canCompute ?
                          tableName ? `${tableName} (${count} row${count === 1 ? '' : 's'})` : undefined :
                          [div({ key: `${tableName}-tooltip`, style: { whiteSpace: 'pre-wrap' } },
                            'You must be an owner, or a writer with compute permission, to view this snapshot.\n\n' +
                            'Contact the owner of this workspace to change your permissions.')],
                        tooltipSide: canCompute ? 'bottom' : 'left',
                        key: `${snapshotName}_${tableName}`,
                        selected: selectedData?.type === workspaceDataTypes.snapshot && selectedData.snapshotName === snapshotName && selectedData.tableName === tableName,
                        entityName: tableName,
                        entityCount: count,
                        onClick: () => {
                          if (canCompute) {
                            setSelectedData({ type: workspaceDataTypes.snapshot, snapshotName, tableName })
                            Ajax().Metrics.captureEvent(Events.workspaceSnapshotContentsView, {
                              ...extractWorkspaceDetails(workspace.workspace),
                              resourceId,
                              snapshotId,
                              entityType: tableName
                            })
                            forceRefresh()
                          }
                        }
                      }, [`${tableName} (${count})`])
                    }, snapshotTablePairs)
                  ])
                )])
              }, sortedSnapshotPairs)
            ]),
            isGoogleWorkspace && h(DataTypeSection, {
              title: 'Reference Data'
            }, [
              _.isEmpty(referenceData) && h(NoDataPlaceholder, {
                message: 'No references have been added.',
                buttonText: 'Add reference data',
                onAdd: () => setImportingReference(true)
              }),
              _.map(type => h(DataTypeButton, {
                key: type,
                wrapperProps: { role: 'listitem' },
                selected: selectedData?.type === workspaceDataTypes.referenceData && selectedData.reference === type,
                onClick: () => {
                  setSelectedData({ type: workspaceDataTypes.referenceData, reference: type })
                  refreshWorkspace()
                },
                after: h(Link, {
                  style: { flex: 0 },
                  disabled: !!Utils.editWorkspaceError(workspace),
                  tooltip: Utils.editWorkspaceError(workspace) || `Delete ${type}`,
                  onClick: e => {
                    e.stopPropagation()
                    setDeletingReference(type)
                  }
                }, [icon('minus-circle', { size: 16 })])
              }, [type]), _.keys(referenceData))
            ]),
            importingReference && h(ReferenceDataImporter, {
              onDismiss: () => setImportingReference(false),
              onSuccess: () => {
                setImportingReference(false)
                refreshWorkspace()
              },
              namespace, name
            }),
            deletingReference && h(ReferenceDataDeleter, {
              onDismiss: () => setDeletingReference(false),
              onSuccess: () => {
                setDeletingReference(false)
                if (selectedData?.type === workspaceDataTypes.referenceData && selectedData.reference === deletingReference) {
                  setSelectedData(undefined)
                }
                refreshWorkspace()
              },
              namespace, name, referenceDataType: deletingReference
            }),
            uploadingFile && h(EntityUploader, {
              onDismiss: () => setUploadingFile(false),
              onSuccess: () => {
                setUploadingFile(false)
                forceRefresh()
                loadMetadata()
              },
              namespace, name,
              entityTypes: _.keys(entityMetadata), dataProvider: entityServiceDataTableProvider,
              isGoogleWorkspace
            }),
            uploadingWDSFile && h(EntityUploader, {
              onDismiss: () => setUploadingWDSFile(false),
              onSuccess: () => {
                setUploadingWDSFile(false)
                forceRefresh()
                loadMetadata()
                notify('success', 'Data imported successfully.')
              },
              namespace, name,
              workspaceId, entityTypes: wdsTypes.state.map(item => item['name']), dataProvider: wdsDataTableProvider,
              isGoogleWorkspace
            }),
            isGoogleWorkspace && h(DataTypeSection, {
              title: 'Other Data'
            }, [
              h(DataTypeButton, {
                wrapperProps: { role: 'listitem' },
                selected: selectedData?.type === workspaceDataTypes.localVariables,
                onClick: () => {
                  setSelectedData({ type: workspaceDataTypes.localVariables })
                  forceRefresh()
                }
              }, ['Workspace Data']),
              h(DataTypeButton, {
                wrapperProps: { role: 'listitem' },
                iconName: 'folder', iconSize: 18,
                selected: selectedData?.type === workspaceDataTypes.bucketObjects,
                onClick: () => {
                  setSelectedData({ type: workspaceDataTypes.bucketObjects })
                  forceRefresh()
                }
              }, ['Files'])
            ])
          ])
        ])
      ]),
      h(SidebarSeparator, { sidebarWidth, setSidebarWidth }),
      div({ style: styles.tableViewPanel }, [
        _.includes(selectedData?.type, [workspaceDataTypes.entities, workspaceDataTypes.entitiesVersion]) && h(DataTableFeaturePreviewFeedbackBanner),
        Utils.cond([createdBy === getUser()?.email || isGoogleWorkspace, () => Utils.switchCase(selectedData?.type, [undefined, () => Utils.cond([isAzureWorkspace && !wdsReady, () => div({ style: { textAlign: 'center', lineHeight: '1.4rem', marginTop: '1rem', marginLeft: '5rem', marginRight: '5rem' } },

          [icon('loadingSpinner'),
            ' Preparing your data tables, this may take a few minutes. ',
            Utils.cond([!uploadingWDSFile, () => div({}, ['You can ', h(Link, { style: { marginTop: '0.5rem' }, onClick: () => setTroubleshootingWds(true) }, ['check the status']), ' of your data table service.'])], '')])],
        () => div({ style: { textAlign: 'center' } }, ['Select a data type from the navigation panel on the left']),
        )],
        [workspaceDataTypes.localVariables, () => h(LocalVariablesContent, {
          workspace,
          refreshKey
        })],
        [workspaceDataTypes.referenceData, () => h(ReferenceDataContent, {
          key: selectedData.reference,
          workspace,
          referenceKey: selectedData.reference
        })],
        [workspaceDataTypes.bucketObjects, () => h(FileBrowser, {
          style: { flex: '1 1 auto' },
          controlPanelStyle: {
            padding: '1rem',
            background: colors.light(0.5)
          },
          workspace,
          extraMenuItems: h(Link, {
            href: `https://seqr.broadinstitute.org/workspace/${namespace}/${name}`,
            style: { padding: '0.5rem' }
          }, [icon('pop-out'), ' Analyze in Seqr']),
          noticeForPrefix: prefix => prefix.startsWith(`${dataTableVersionsPathRoot}/`) ?
            'Files in this folder are managed via data table versioning.' :
            null,
          shouldDisableEditForPrefix: prefix => prefix.startsWith(`${dataTableVersionsPathRoot}/`)
        })],
        [workspaceDataTypes.snapshot, () => h(SnapshotContent, {
          key: refreshKey,
          workspace,
          snapshotDetails,
          snapshotName: selectedData.snapshotName,
          tableName: selectedData.tableName,
          loadMetadata: () => loadSnapshotEntities(selectedData.snapshotName),
          onUpdate: async newSnapshotName => {
            await loadSnapshotMetadata()
            setSelectedData({ type: workspaceDataTypes.snapshot, snapshotName: newSnapshotName })
            forceRefresh()
          },
          onDelete: async () => {
            await loadSnapshotMetadata()
            setSelectedData(undefined)
            forceRefresh()
          }
        })],
        [workspaceDataTypes.entities, () => h(EntitiesContent, {
          key: refreshKey,
          workspace,
          entityMetadata,
          setEntityMetadata,
          entityKey: selectedData.entityType,
          activeCrossTableTextFilter,
          loadMetadata,
          deleteColumnUpdateMetadata,
          forceRefresh
        })],
        [workspaceDataTypes.entitiesVersion, () => h(DataTableVersion, {
          workspace,
          version: selectedData.version,
          onDelete: reportErrorAndRethrow('Error deleting version', async () => {
            await deleteDataTableVersion(selectedData.version)
            setSelectedData(undefined)
          }),
          onImport: reportErrorAndRethrow('Error importing version', async () => {
            const { tableName } = await importDataTableVersion(selectedData.version)
            await loadMetadata()
            setSelectedData({ type: workspaceDataTypes.entities, entityType: tableName })
          })
        })],
        [workspaceDataTypes.wds, () => wdsDataTableProvider && wdsReady && !_.isEmpty(wdsTypes.state) && h(WDSContent, {
          key: refreshKey,
          workspaceUUID: workspaceId,
          workspace,
          dataProvider: wdsDataTableProvider,
          recordType: selectedData.entityType,
          wdsSchema: wdsTypes.state
        })]
        )], () => div({ style: { textAlign: 'center', lineHeight: '1.4rem', marginTop: '1rem', marginLeft: '5rem', marginRight: '5rem' } }, ['Currently, only a workspace creator can use data tables. If you were invited to this workspace, you can use the clone feature to create your own workspace to use data tables.']))
      // ]
      ])
    ])
  ])
})

export const navPaths = [
  {
    name: 'workspace-data',
    path: '/workspaces/:namespace/:name/data',
    component: WorkspaceData,
    title: ({ name }) => `${name} - Data`
  }
]
