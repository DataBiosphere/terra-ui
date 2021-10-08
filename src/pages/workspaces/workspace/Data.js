import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment, useEffect, useImperativeHandle, useState } from 'react'
import { div, h, h3 } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import Collapse from 'src/components/Collapse'
import { Clickable, Link, spinnerOverlay } from 'src/components/common'
import { EntityUploader, ReferenceDataDeleter, ReferenceDataImporter, renderDataCell, saveScroll } from 'src/components/data/data-utils'
import EntitiesContent from 'src/components/data/EntitiesContent'
import LocalVariablesContent from 'src/components/data/LocalVariablesContent'
import Dropzone from 'src/components/Dropzone'
import FloatingActionButton from 'src/components/FloatingActionButton'
import { icon, spinner } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import Interactive from 'src/components/Interactive'
import Modal from 'src/components/Modal'
import { FlexTable, HeaderCell, SimpleTable, TextCell } from 'src/components/table'
import UriViewer from 'src/components/UriViewer'
import { SnapshotInfo } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { asyncImportJobStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const localVariables = 'localVariables'
const bucketObjects = '__bucket_objects__'

const styles = {
  tableContainer: {
    display: 'flex', flex: 1
  },
  dataTypeSelectionPanel: {
    flex: 'none', width: 280, backgroundColor: 'white',
    boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)'
  },
  tableViewPanel: {
    position: 'relative',
    overflow: 'hidden',
    padding: '1rem', width: '100%',
    flex: 1, display: 'flex', flexDirection: 'column'
  }
}

const DataTypeButton = ({ selected, entityName, children, entityCount, iconName = 'listAlt', iconSize = 14, buttonStyle, after, ...props }) => {
  const isEntity = entityName !== undefined

  return h(Interactive, {
    style: { ...Style.navList.itemContainer(selected) },
    hover: Style.navList.itemHover(selected),
    as: 'div',
    role: 'listitem'
  }, [
    h(Clickable, {
      style: { flex: '1 1 auto', maxWidth: 232, ...Style.navList.item(selected), color: colors.accent(1.2), ...buttonStyle },
      ...(isEntity ? {
        tooltip: entityName ? `${entityName} (${entityCount} row${entityCount === 1 ? '' : 's'})` : undefined,
        tooltipDelay: 250,
        useTooltipAsLabel: true
      } : {}),
      'aria-current': selected,
      ...props
    }, [
      div({ style: { flex: 'none', display: 'flex', width: '1.5rem' } }, [
        icon(iconName, { size: iconSize })
      ]),
      div({ style: { flex: 1, ...Style.noWrapEllipsis } }, [
        entityName || children
      ]),
      isEntity && div({ style: { flex: 0, paddingLeft: '0.5em' } }, `(${entityCount})`)
    ]),
    after
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
    h(DelayedSearchInput, {
      'aria-label': 'Search',
      style: { width: 300, marginBottom: '1rem', alignSelf: 'flex-end' },
      placeholder: 'Search',
      onChange: setTextFilter,
      value: textFilter
    }),
    div({ style: { flex: 1 } }, [
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
          ]
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
      entityKey: tableName,
      loadMetadata,
      firstRender
    })],
    () => h(SnapshotInfo, { workspace, resource: snapshotDetails[snapshotName].resource, snapshotName, onUpdate, onDelete })
  )
}

export const DeleteObjectModal = ({ name, workspace: { workspace: { googleProject, bucketName } }, onSuccess, onDismiss }) => {
  const [deleting, setDeleting] = useState(false)

  const doDelete = _.flow(
    withErrorReporting('Error deleting object'),
    Utils.withBusyState(setDeleting)
  )(async () => {
    await Ajax().Buckets.delete(googleProject, bucketName, name)
    onSuccess()
  })

  return h(Modal, {
    onDismiss,
    okButton: doDelete,
    title: 'Delete this file?',
    danger: true
  }, [
    'Are you sure you want to delete this file from the Google bucket?',
    deleting && spinnerOverlay
  ])
}

const BucketContent = _.flow(
  Utils.withDisplayName('BucketContent'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({
  workspace, workspace: { workspace: { namespace, googleProject, bucketName, name: workspaceName } }, firstRender, refreshKey,
  onRequesterPaysError
}) => {
  // State
  const [prefix, setPrefix] = useState(() => firstRender ? (StateHistory.get().prefix || '') : '')
  const [prefixes, setPrefixes] = useState(undefined)
  const [objects, setObjects] = useState(() => firstRender ? StateHistory.get().objects : undefined)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingName, setDeletingName] = useState(undefined)
  const [viewingName, setViewingName] = useState(undefined)

  const signal = Utils.useCancellation()


  // Helpers
  const load = _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error loading bucket data'),
    Utils.withBusyState(setLoading)
  )(async (targetPrefix = prefix) => {
    const { items, prefixes } = await Ajax(signal).Buckets.list(googleProject, bucketName, targetPrefix)
    setPrefix(targetPrefix)
    setPrefixes(prefixes)
    setObjects(items)
  })

  const uploadFiles = _.flow(
    withErrorReporting('Error uploading file'),
    Utils.withBusyState(setUploading)
  )(async ([file]) => {
    await Ajax().Buckets.upload(googleProject, bucketName, prefix, file)
    load()
  })


  // Lifecycle
  useEffect(() => {
    load(firstRender ? undefined : '')
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    StateHistory.update({ objects, prefix })
  }, [objects, prefix])


  // Render
  const prefixParts = _.dropRight(1, prefix.split('/'))
  const makeBucketLink = ({ label, target, onClick, ...props }) => h(Link, {
    as: 'a',
    style: { textDecoration: 'underline' },
    href: target,
    onClick: e => {
      e.preventDefault()
      onClick()
    },
    ...props
  }, [label])

  const prefixBreadcrumbs = [
    { label: 'Files', target: '' },
    ..._.map(n => {
      return { label: prefixParts[n], target: _.map(s => `${s}/`, _.take(n + 1, prefixParts)).join('') }
    }, _.range(0, prefixParts.length))
  ]

  return h(Dropzone, {
    disabled: !!Utils.editWorkspaceError(workspace),
    style: { flexGrow: 1, backgroundColor: 'white', border: `1px solid ${colors.dark(0.55)}`, padding: '1rem' },
    activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
    onDropAccepted: uploadFiles
  }, [({ openUploader }) => h(Fragment, [
    div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
      div({ role: 'navigation' }, [
        _.flow(
          Utils.toIndexPairs,
          _.map(([i, { label, target }]) => {
            return h(Fragment, { key: target }, [
              makeBucketLink({
                label,
                target: `gs://${bucketName}/${target}`,
                onClick: () => load(target),
                'aria-current': i === prefixBreadcrumbs.length - 1 ? 'location' : undefined
              }),
              ' / '
            ])
          })
        )(prefixBreadcrumbs)
      ]),
      h(Link, { href: `https://seqr.broadinstitute.org/workspace/${namespace}/${workspaceName}` },
        ['Analyze in Seqr ', icon('pop-out', { size: 14 })]
      )
    ]),
    div({ style: { margin: '1rem -1rem 1rem -1rem', borderBottom: `1px solid ${colors.dark(0.25)}` } }),
    h(SimpleTable, {
      'aria-label': 'file browser',
      columns: [
        { header: div({ className: 'sr-only' }, ['Actions']), size: { basis: 24, grow: 0 }, key: 'button' },
        { header: h(HeaderCell, ['Name']), size: { grow: 1 }, key: 'name' },
        { header: h(HeaderCell, ['Size']), size: { basis: 200, grow: 0 }, key: 'size' },
        { header: h(HeaderCell, ['Last modified']), size: { basis: 200, grow: 0 }, key: 'updated' }
      ],
      rows: [
        ..._.map(p => {
          return {
            button: div({ style: { display: 'flex' } }, [
              icon('folder', { size: 16, 'aria-label': 'folder' })
            ]),
            name: h(TextCell, [
              makeBucketLink({
                label: p.slice(prefix.length),
                target: `gs://${bucketName}/${p}`,
                onClick: () => load(p),
                'aria-label': `${p.slice(prefix.length, -1)} (folder)`
              })
            ])
          }
        }, prefixes),
        ..._.map(({ name, size, updated }) => {
          return {
            button: h(Link, {
              style: { display: 'flex' }, onClick: () => setDeletingName(name),
              tooltip: 'Delete file'
            }, [
              icon('trash', { size: 16, className: 'hover-only' })
            ]),
            name: h(TextCell, [
              makeBucketLink({
                label: name.slice(prefix.length),
                target: `gs://${bucketName}/${name}`,
                onClick: () => setViewingName(name),
                'aria-haspopup': 'dialog',
                'aria-label': `${name.slice(prefix.length)} (file)`
              })
            ]),
            size: filesize(size, { round: 0 }),
            updated: Utils.makePrettyDate(updated)
          }
        }, objects)
      ]
    }),
    deletingName && h(DeleteObjectModal, {
      workspace, name: deletingName,
      onDismiss: () => setDeletingName(),
      onSuccess: () => {
        setDeletingName()
        load()
      }
    }),
    viewingName && h(UriViewer, {
      googleProject, uri: `gs://${bucketName}/${viewingName}`,
      onDismiss: () => setViewingName(undefined)
    }),
    !Utils.editWorkspaceError(workspace) && h(FloatingActionButton, {
      label: 'UPLOAD',
      iconShape: 'plus',
      onClick: openUploader
    }),
    (loading || uploading) && spinnerOverlay
  ])])
})

const DataTypeSection = ({ title, titleExtras, error, retryFunction, children }) => div({
  role: 'listitem'
}, [
  h3({ style: Style.navList.heading }, [
    title,
    error ? h(Link, {
      onClick: retryFunction,
      tooltip: 'Error loading, click to retry.'
    }, [icon('sync', { size: 18 })]) : titleExtras
  ]),
  !!children?.length && div({
    style: { display: 'flex', flexDirection: 'column', width: '100%' },
    role: 'list'
  }, [children])
])

const WorkspaceData = _.flow(
  Utils.forwardRefWithName('WorkspaceData'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Data', activeTab: 'data'
  })
)(({ namespace, name, workspace, workspace: { workspace: { googleProject, attributes } }, refreshWorkspace }, ref) => {
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

  const signal = Utils.useCancellation()
  const asyncImportJobs = Utils.useStore(asyncImportJobStore)


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
      setSnapshotDetails(_.set([snapshotName, 'entityMetadata'], entities))
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

  // Lifecycle
  Utils.useOnMount(() => {
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

  return div({ style: styles.tableContainer }, [
    !entityMetadata ? spinnerOverlay : h(Fragment, [
      div({ style: styles.dataTypeSelectionPanel, role: 'navigation', 'aria-label': 'data in this workspace' }, [
        div({ role: 'list' }, [
          h(DataTypeSection, {
            title: 'Tables',
            titleExtras: h(Link, {
              disabled: !!Utils.editWorkspaceError(workspace),
              tooltip: Utils.editWorkspaceError(workspace) || 'Upload .tsv',
              onClick: () => setUploadingFile(true),
              'aria-haspopup': 'dialog'
            }, [icon('plus-circle', { size: 21 })]),
            error: entityMetadataError,
            retryFunction: loadEntityMetadata
          }, [
            _.some({ targetWorkspace: { namespace, name } }, asyncImportJobs) && h(DataImportPlaceholder),
            _.map(([type, typeDetails]) => {
              return h(DataTypeButton, {
                key: type,
                selected: selectedDataType === type,
                entityName: type,
                entityCount: typeDetails.count,
                onClick: () => {
                  setSelectedDataType(type)
                  forceRefresh()
                }
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
                    // TODO: is this the correct permission to check? Is this reliable?
                    const canCompute = !!(workspace?.canCompute)
                    return h(DataTypeButton, {
                      // TODO: if reader, should be greyed out. What's the right color style? Any other styling?
                      buttonStyle: canCompute ? { borderBottom: 0, height: 40 } : { borderBottom: 0, height: 40, color: '#ddd' },
                      // TODO: how to override the tooltip only if the user doesn't have compute? If user does have compute, we want to
                      // use the default tooltip.
                      tooltip: canCompute ? (tableName ? `${tableName} (${count} row${count === 1 ? '' : 's'})` : undefined) : 'You must have compute',
                      tooltipDelay: 250,
                      useTooltipAsLabel: true,
                      key: `${snapshotName}_${tableName}`,
                      selected: _.isEqual(selectedDataType, [snapshotName, tableName]),
                      entityName: tableName,
                      entityCount: count,
                      onClick: () => {
                        // TODO: if reader, click should do nothing. Should the click instead pop up an error message?
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
            title: 'Reference Data',
            titleExtras: h(Link, {
              disabled: !!Utils.editWorkspaceError(workspace),
              tooltip: Utils.editWorkspaceError(workspace) || 'Add reference data',
              onClick: () => setImportingReference(true),
              'aria-haspopup': 'dialog'
            }, [icon('plus-circle', { size: 21 })])
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
      ]),
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
          ['bucketObjects', () => h(BucketContent, {
            workspace, onClose: () => setSelectedDataType(undefined),
            firstRender, refreshKey
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
            entityKey: selectedDataType,
            loadMetadata,
            firstRender
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
