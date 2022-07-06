import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { DraggableCore } from 'react-draggable'
import { div, form, h, h3, input, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { ButtonOutline, Clickable, DeleteConfirmationModal, Link, spinnerOverlay } from 'src/components/common'
import { EntityUploader, ReferenceDataDeleter, ReferenceDataImporter, renderDataCell, saveScroll } from 'src/components/data/data-utils'
import EntitiesContent from 'src/components/data/EntitiesContent'
import ExportDataModal from 'src/components/data/ExportDataModal'
import FileBrowser from 'src/components/data/FileBrowser'
import LocalVariablesContent from 'src/components/data/LocalVariablesContent'
import RenameTableModal from 'src/components/data/RenameTableModal'
import { icon, spinner } from 'src/components/icons'
import { ConfirmedSearchInput, DelayedSearchInput } from 'src/components/input'
import Interactive from 'src/components/Interactive'
import { MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { FlexTable, HeaderCell } from 'src/components/table'
import { SnapshotInfo } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { reportError, withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { asyncImportJobStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const localVariables = 'localVariables'
const bucketObjects = '__bucket_objects__'

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

const DataTypeButton = ({ selected, entityName, children, entityCount, iconName = 'listAlt', iconSize = 14, buttonStyle, filteredCount, crossTableSearchInProgress, activeCrossTableTextFilter, after, ...props }) => {
  const isEntity = entityName !== undefined

  return h(Interactive, {
    style: { ...Style.navList.itemContainer(selected), backgroundColor: selected ? colors.dark(0.1) : 'white' },
    hover: Style.navList.itemHover(selected),
    as: 'div',
    role: 'listitem'
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

const ReferenceDataContent = ({ workspace: { workspace: { googleProject, attributes } }, referenceKey, firstRender }) => {
  const [textFilter, setTextFilter] = useState('')

  const selectedData = _.flow(
    _.filter(({ key, value }) => Utils.textMatch(textFilter, `${key} ${value}`)),
    _.sortBy('key')
  )(getReferenceData(attributes)[referenceKey])
  const { initialY } = firstRender ? StateHistory.get() : {}

  return h(Fragment, [
    div({
      style: {
        display: 'flex', justifyContent: 'flex-end',
        padding: '1rem',
        background: colors.light(),
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
          onScroll: y => saveScroll(0, y),
          initialY,
          noContentMessage: 'No matching data',
          columns: [
            {
              size: { basis: 400, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Key']),
              cellRenderer: ({ rowIndex }) => renderDataCell(selectedData[rowIndex].key, googleProject)
            },
            {
              size: { grow: 1 },
              headerRenderer: () => h(HeaderCell, ['Value']),
              cellRenderer: ({ rowIndex }) => renderDataCell(selectedData[rowIndex].value, googleProject)
            }
          ],
          border: false
        })
      ])
    ])
  ])
}
const SnapshotContent = ({ workspace, snapshotDetails, loadMetadata, onUpdate, onDelete, firstRender, snapshotKey: [snapshotName, tableName] }) => {
  return Utils.cond(
    [!snapshotDetails?.[snapshotName], () => spinnerOverlay],
    [!!tableName, () => h(EntitiesContent, {
      snapshotName,
      workspace,
      entityMetadata: snapshotDetails[snapshotName].entityMetadata,
      setEntityMetadata: () => {},
      entityKey: tableName,
      loadMetadata,
      firstRender
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
        textTransform: 'uppercase'
      }
    }, title),
    titleFirst: true,
    initialOpenState: true,
    summaryStyle: {
      paddingRight: error ? '1rem' : 0,
      borderBottom: `0.5px solid ${colors.dark(0.2)}`,
      backgroundColor: colors.light(0.4),
      fontSize: 16
    },
    buttonProps: {
      hover: {
        color: colors.dark(0.9)
      }
    },
    buttonStyle: {
      padding: `1.125rem ${error ? '1rem' : '1.5rem'} 1.25rem 1.5rem`,
      marginBottom: 0,
      color: colors.dark()
    },
    afterToggle: error && h(Link, {
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

const DataTableActions = ({ workspace, tableName, rowCount, onRenameTable, onDeleteTable }) => {
  const { workspace: { namespace, name }, workspaceSubmissionStats: { runningSubmissionsCount } } = workspace
  const isSetOfSets = tableName.endsWith('_set_set')

  const editWorkspaceErrorMessage = Utils.editWorkspaceError(workspace)

  const downloadForm = useRef()
  const signal = useCancellation()

  const [loading, setLoading] = useState(false)
  const [entities, setEntities] = useState([])
  const [exporting, setExporting] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
        h(MenuButton, {
          disabled: isSetOfSets,
          tooltip: isSetOfSets ?
            'Downloading sets of sets as TSV is not supported at this time.' :
            'Download a TSV file containing all rows in this table.',
          onClick: () => {
            downloadForm.current.submit()
            Ajax().Metrics.captureEvent(Events.workspaceDataDownload, {
              ...extractWorkspaceDetails(workspace.workspace),
              downloadFrom: 'all rows',
              fileType: '.tsv'
            })
          }
        }, 'Download TSV'),
        h(MenuButton, {
          onClick: _.flow(
            Utils.withBusyState(setLoading),
            withErrorReporting('Error loading entities.')
          )(async () => {
            const queryResults = await Ajax(signal).Workspaces.workspace(namespace, name).paginatedEntitiesOfType(tableName, { pageSize: rowCount })
            setEntities(_.map(_.get('name'), queryResults.results))
            setExporting(true)
          })
        }, 'Export to workspace'),
        h(MenuButton, {
          onClick: () => {
            setRenaming(true)
          },
          disabled: !!editWorkspaceErrorMessage,
          tooltip: editWorkspaceErrorMessage || ''
        }, 'Rename table'),
        h(MenuButton, {
          onClick: () => setDeleting(true),
          disabled: !!editWorkspaceErrorMessage,
          tooltip: editWorkspaceErrorMessage || ''
        }, 'Delete table')
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
    renaming && h(RenameTableModal, {
      onDismiss: () => setRenaming(false),
      onUpdateSuccess: onRenameTable,
      namespace, name,
      selectedDataType: tableName
    }),
    deleting && h(DeleteConfirmationModal, {
      objectType: 'table',
      objectName: tableName,
      onDismiss: () => setDeleting(false),
      onConfirm: Utils.withBusyState(setLoading)(async () => {
        try {
          await Ajax().Workspaces.workspace(namespace, name).deleteEntitiesOfType(tableName)
          Ajax().Metrics.captureEvent(Events.workspaceDataDeleteTable, {
            ...extractWorkspaceDetails(workspace.workspace)
          })
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

const WorkspaceData = _.flow(
  forwardRefWithName('WorkspaceData'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Data', activeTab: 'data'
  })
)(({ namespace, name, workspace, workspace: { workspace: { googleProject, attributes, workspaceId } }, refreshWorkspace }, ref) => {
  // State
  const [firstRender, setFirstRender] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const forceRefresh = () => setRefreshKey(_.add(1))
  const [selectedDataType, setSelectedDataType] = useState(() => StateHistory.get().selectedDataType)
  const [entityMetadata, setEntityMetadata] = useState(() => StateHistory.get().entityMetadata)
  const [snapshotDetails, setSnapshotDetails] = useState(() => StateHistory.get().snapshotDetails)
  const [importingReference, setImportingReference] = useState(false)
  const [deletingReference, setDeletingReference] = useState(undefined)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [entityMetadataError, setEntityMetadataError] = useState()
  const [snapshotMetadataError, setSnapshotMetadataError] = useState()
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [activeCrossTableTextFilter, setActiveCrossTableTextFilter] = useState('')
  const [crossTableResultCounts, setCrossTableResultCounts] = useState({})
  const [crossTableSearchInProgress, setCrossTableSearchInProgress] = useState(false)

  const signal = useCancellation()
  const asyncImportJobs = useStore(asyncImportJobStore)


  // Helpers
  const getSelectionType = () => {
    const referenceData = getReferenceData(attributes)
    return Utils.cond(
      [!selectedDataType, () => 'none'],
      [selectedDataType === localVariables, () => 'localVariables'],
      [selectedDataType === bucketObjects, () => 'bucketObjects'],
      [_.isArray(selectedDataType), () => 'snapshots'],
      [_.includes(selectedDataType, _.keys(referenceData)), () => 'referenceData'],
      () => 'entities'
    )
  }

  const loadEntityMetadata = async () => {
    try {
      setEntityMetadata(undefined)
      setEntityMetadataError(false)
      const entityMetadata = await Ajax(signal).Workspaces.workspace(namespace, name).entityMetadata()

      setSelectedDataType(getSelectionType() === 'entities' && !entityMetadata[selectedDataType] ? undefined : selectedDataType)
      setEntityMetadata(entityMetadata)
    } catch (error) {
      reportError('Error loading workspace entity data', error)
      setEntityMetadataError(true)
      setSelectedDataType(undefined)
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
      setSelectedDataType(undefined)
      setSnapshotDetails({})
    }
  }

  const loadMetadata = () => Promise.all([loadEntityMetadata(), loadSnapshotMetadata(), getRunningImportJobs()])

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
    setFirstRender(false)
  })

  useEffect(() => {
    StateHistory.update({ entityMetadata, selectedDataType, snapshotDetails })
  }, [entityMetadata, selectedDataType, snapshotDetails])

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

  return div({ style: styles.tableContainer }, [
    !entityMetadata ? spinnerOverlay : h(Fragment, [
      div({ style: { ...styles.sidebarContainer, width: sidebarWidth } }, [
        div({
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
                onClick: () => setUploadingFile(true)
              }, 'Upload TSV'),
              h(MenuButton, {
                href: `${Nav.getLink('upload')}?${qs.stringify({ workspace: workspaceId })}`
              }, ['Open data uploader']),
              h(MenuButton, {
                'aria-haspopup': 'dialog',
                onClick: () => setImportingReference(true)
              }, 'Add reference data')
            ])
          }, [h(ButtonOutline, {
            disabled: !canEditWorkspace,
            tooltip: canEditWorkspace ? 'Add data to this workspace' : editWorkspaceErrorMessage,
            style: { flex: 1 }
          }, [span([icon('plus-circle', { style: { marginRight: '1ch' } }), 'Import data'])])])
        ]),
        div({ style: styles.dataTypeSelectionPanel, role: 'navigation', 'aria-label': 'data in this workspace' }, [
          div({ role: 'list' }, [
            h(DataTypeSection, {
              title: 'Tables',
              error: entityMetadataError,
              retryFunction: loadEntityMetadata
            }, [
              _.some({ targetWorkspace: { namespace, name } }, asyncImportJobs) && h(DataImportPlaceholder),
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
                return h(DataTypeButton, {
                  key: type,
                  selected: selectedDataType === type,
                  entityName: type,
                  entityCount: typeDetails.count,
                  filteredCount: _.find({ typeName: type }, crossTableResultCounts)?.filteredCount,
                  activeCrossTableTextFilter,
                  crossTableSearchInProgress,
                  onClick: () => {
                    setSelectedDataType(type)
                    forceRefresh()
                  },
                  after: h(DataTableActions, {
                    tableName: type,
                    rowCount: typeDetails.count,
                    workspace,
                    onRenameTable: () => loadMetadata(),
                    onDeleteTable: tableName => {
                      setSelectedDataType(undefined)
                      setEntityMetadata(_.unset(tableName))
                    }
                  })
                })
              }, sortedEntityPairs)
            ]),
            (!_.isEmpty(sortedSnapshotPairs) || snapshotMetadataError) && h(DataTypeSection, {
              title: 'Snapshots',
              error: snapshotMetadataError,
              retryFunction: loadSnapshotMetadata
            }, [
              _.map(([snapshotName, { resource: { resourceId, snapshotId }, entityMetadata: snapshotTables, error: snapshotTablesError }]) => {
                const snapshotTablePairs = toSortedPairs(snapshotTables)
                return h(Collapse, {
                  key: snapshotName,
                  titleFirst: true,
                  buttonStyle: { height: 50, color: colors.dark(), fontWeight: 600, marginBottom: 0, overflow: 'hidden' },
                  buttonProps: { tooltip: snapshotName, tooltipDelay: 250 },
                  style: { fontSize: 14, paddingLeft: '1.5rem', borderBottom: `1px solid ${colors.dark(0.2)}` },
                  title: snapshotName, noTitleWrap: true,
                  role: 'listitem',
                  afterToggle: h(Link, {
                    style: { marginRight: '0.5rem' },
                    tooltip: 'Snapshot Info',
                    onClick: () => {
                      setSelectedDataType([snapshotName])
                      forceRefresh()
                    }
                  }, [icon(`info-circle${_.isEqual(selectedDataType, [snapshotName]) ? '' : '-regular'}`, { size: 20 })]),
                  initialOpenState: _.head(selectedDataType) === snapshotName,
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
                        buttonStyle: { borderBottom: 0, height: 40, ...(canCompute ? {} : { color: colors.dark(0.25) }) },
                        tooltip: canCompute ?
                          tableName ? `${tableName} (${count} row${count === 1 ? '' : 's'})` : undefined :
                          [div({ key: `${tableName}-tooltip`, style: { whiteSpace: 'pre-wrap' } },
                            'You must be an owner, or a writer with compute permission, to view this snapshot.\n\n' +
                            'Contact the owner of this workspace to change your permissions.')],
                        tooltipSide: canCompute ? 'bottom' : 'left',
                        key: `${snapshotName}_${tableName}`,
                        selected: _.isEqual(selectedDataType, [snapshotName, tableName]),
                        entityName: tableName,
                        entityCount: count,
                        onClick: () => {
                          if (canCompute) {
                            setSelectedDataType([snapshotName, tableName])
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
            h(DataTypeSection, {
              title: 'Reference Data'
            }, [_.map(type => h(DataTypeButton, {
              key: type,
              selected: selectedDataType === type,
              onClick: () => {
                setSelectedDataType(type)
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
            }, [type]), _.keys(referenceData)
            )]),
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
                setSelectedDataType(selectedDataType === deletingReference ? undefined : selectedDataType)
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
              entityTypes: _.keys(entityMetadata)
            }),
            h(DataTypeSection, {
              title: 'Other Data'
            }, [
              h(DataTypeButton, {
                selected: selectedDataType === localVariables,
                onClick: () => {
                  setSelectedDataType(localVariables)
                  forceRefresh()
                }
              }, ['Workspace Data']),
              h(DataTypeButton, {
                iconName: 'folder', iconSize: 18,
                selected: selectedDataType === bucketObjects,
                onClick: () => {
                  setSelectedDataType(bucketObjects)
                  forceRefresh()
                }
              }, ['Files'])
            ])
          ])
        ])
      ]),
      h(SidebarSeparator, { sidebarWidth, setSidebarWidth }),
      div({ style: styles.tableViewPanel }, [
        Utils.switchCase(getSelectionType(),
          ['none', () => div({ style: { textAlign: 'center' } }, ['Select a data type'])],
          ['localVariables', () => h(LocalVariablesContent, {
            workspace,
            refreshKey,
            firstRender
          })],
          ['referenceData', () => h(ReferenceDataContent, {
            key: selectedDataType,
            workspace,
            referenceKey: selectedDataType,
            firstRender
          })],
          ['bucketObjects', () => h(FileBrowser, {
            style: { flex: '1 1 auto' },
            controlPanelStyle: {
              padding: '1rem',
              background: colors.light()
            },
            workspace,
            extraMenuItems: h(Link, {
              href: `https://seqr.broadinstitute.org/workspace/${namespace}/${name}`,
              style: { padding: '0.5rem' }
            }, [icon('pop-out'), ' Analyze in Seqr'])
          })],
          ['snapshots', () => h(SnapshotContent, {
            key: refreshKey,
            workspace,
            snapshotDetails,
            snapshotKey: selectedDataType,
            loadMetadata: () => loadSnapshotEntities(selectedDataType[0]),
            onUpdate: async newSnapshotName => {
              await loadSnapshotMetadata()
              setSelectedDataType([newSnapshotName])
              forceRefresh()
            },
            onDelete: async () => {
              await loadSnapshotMetadata()
              setSelectedDataType()
              forceRefresh()
            },
            firstRender
          })],
          ['entities', () => h(EntitiesContent, {
            key: refreshKey,
            workspace,
            entityMetadata,
            setEntityMetadata,
            entityKey: selectedDataType,
            activeCrossTableTextFilter,
            loadMetadata,
            firstRender,
            deleteColumnUpdateMetadata,
            forceRefresh
          })]
        )
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
