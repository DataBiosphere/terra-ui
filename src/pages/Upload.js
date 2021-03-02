import filesize from 'filesize'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { div, h, h2, h3, h4, p, span, code, ul, li, a } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { Link, Select, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common'
import UploadPreviewTable from 'src/components/data/UploadPreviewTable'
import Dropzone from 'src/components/Dropzone'
import FloatingActionButton from 'src/components/FloatingActionButton'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import { DelayedSearchInput, ValidatedInput } from 'src/components/input'
import { NameModal } from 'src/components/NameModal'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { UploadProgressModal } from 'src/components/ProgressBar'
import { HeaderCell, SimpleTable, TextCell } from 'src/components/table'
import TopBar from 'src/components/TopBar'
import UriViewer from 'src/components/UriViewer'
import { NoWorkspacesMessage, useWorkspaces, WorkspaceBreadcrumbHeader, WorkspaceTagSelect } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { useStaticStorageSlot } from 'src/libs/browser-storage'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import { useQueryParam } from 'src/libs/nav'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { uploadFiles, useUploader } from 'src/libs/uploads'
import { readFileAsText, withBusyState } from 'src/libs/utils'
import * as Utils from 'src/libs/utils'
import { DeleteObjectModal } from 'src/pages/workspaces/workspace/Data'

// As you add support for uploading additional types of metadata, add them here.
// You may also need to adjust the validation logic.
const supportedEntityTypes = ['entity'];

const rootPrefix = 'uploads/'

const styles = {
  pageContainer: {
    display: 'flex',
    flex: 1,
    flexFlow: 'row no-wrap',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    justifyContent: 'space-between'
  },
  tableContainer: {
    display: 'flex', flex: 1
  },
  dataTypeSelectionPanel: {
    flex: 'none', width: 280, backgroundColor: 'white',
    boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)'
  },
  dataTypeActive: {
    color: colors.light(),
    backgroundColor: colors.accent()
  },
  tableViewPanel: {
    position: 'relative',
    overflow: 'hidden',
    padding: '1rem', width: '100%',
    flex: 1, display: 'flex', flexDirection: 'column'
  },
  workspaceTilesContainer: {
    textAlign: 'left',
    margin: 0,
    padding: 0,
    listStyle: 'none'
  },
  workspaceTile: {
    display: 'block',
    width: '100%',
    borderRadius: '5px',
    padding: '1rem',
    overflowWrap: 'break-word',
    backgroundColor: 'white',
    boxShadow: 'rgba(0, 0, 0, 0.35) 0px 2px 5px 0px, rgba(0, 0, 0, 0.12) 0px 3px 2px 0px',
    // minHeight: '125px',
    margin: '0px 1rem 2rem 0px'
  },
  workspaceTileSelected: {
    backgroundColor: colors.accent(),
    color: 'white'
  },
  tabPanelHeader: {
    position: 'relative'
  },
  heading: {
    ...Style.elements.sectionHeader,
    margin: '1rem 0',
    textTransform: 'uppercase',
    textAlign: 'center',
    verticalAlign: 'middle'
  },
  instructions: {
    lineHeight: '1.4em'
  },
  nextLink: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: '1rem 0'
  },
  prevLink: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: '1rem 0'
  },
  filter: { marginRight: '1rem', flex: '1 0 auto', minWidth: '10em' }
}

const PrevLink = ({ step, setCurrentStep }) => {
  return h(Link, {
    style: styles.prevLink,
    onClick: () => setCurrentStep(step)
  }, ['< Previous'])

}
const NextLink = ({ step, setCurrentStep, stepIsEnabled }) => {
  return h(Link, {
    style: styles.nextLink,
    disabled: !stepIsEnabled(step),
    onClick: () => setCurrentStep(step)
  }, ['Next >'])
}

const DataTypeSection = ({ title, icon, step, currentStep, setCurrentStep, stepIsEnabled, children, ...props }) => {
  const active = currentStep === step
  return div({
    style: _.merge(Style.navList.heading, active ? styles.dataTypeActive : null)
  }, [
    h(Link, {
      disabled: !stepIsEnabled(step),
      onClick: () => setCurrentStep(step),
      style: { color: active ? colors.light() : undefined },
      variant: active ? 'light' : 'dark',
      props
    }, [
      icon,
      title
    ]),
    children
  ])
}


const WorkspaceSelectorPanel = ({
                                  workspaces, selectedWorkspaceId, setWorkspaceId, setCreatingNewWorkspace, children,
                                  ...props
                                }) => {
  const { query } = Nav.useRoute()
  const [filter, setFilter] = useState(query.filter || '')
  const [projectsFilter, setProjectsFilter] = useState(query.projectsFilter || undefined)
  const [tagsFilter, setTagsFilter] = useState(query.tagsFilter || [])

  useEffect(() => {
    // Note: setting undefined so that falsy values don't show up at all
    const newSearch = qs.stringify({
      ...query, filter: filter || undefined, projectsFilter, tagsFilter
    }, { addQueryPrefix: true })

    if (newSearch !== Nav.history.location.search) {
      Nav.history.replace({ search: newSearch })
    }
  })

  const filteredWorkspaces = useMemo(() => _.filter(ws => {
    const { workspace: { namespace, name, attributes } } = ws
    return Utils.textMatch(filter, `${namespace}/${name}`) &&
      (_.isEmpty(projectsFilter) || projectsFilter === namespace) &&
      _.every(a => _.includes(a, _.get(['tag:tags', 'items'], attributes)), tagsFilter)
  }, workspaces), [workspaces, filter, projectsFilter, tagsFilter])

  return div([
    h2({ style: styles.heading }, [
      'Select a Workspace',
      h(Link, {
          'aria-label': 'Create new workspace', onClick: () => setCreatingNewWorkspace(true),
          style: { marginLeft: '0.5rem' },
          tooltip: 'Create a new workspace'
        },
        [icon('lighter-plus-circle', { size: 24 })])
    ]),
    p({ style: styles.instructions }, [
      'You must first select the workspace you wish to upload your files into. You have access to the following workspaces:'
    ]),
    children,
    div({ style: { display: 'flex', marginBottom: '2rem', alignItems: 'center' } }, [
      div({ style: styles.filter }, [
        h(DelayedSearchInput, {
          placeholder: 'Search Workspaces',
          'aria-label': 'Search workspaces',
          onChange: setFilter,
          value: filter
        })
      ]),
      div({ style: styles.filter }, [
        h(WorkspaceTagSelect, {
          isClearable: true,
          isMulti: true,
          formatCreateLabel: _.identity,
          value: _.map(tag => ({ label: tag, value: tag }), tagsFilter),
          placeholder: 'Tags',
          'aria-label': 'Filter by tags',
          onChange: data => setTagsFilter(_.map('value', data))
        })
      ]),
      div({ style: styles.filter }, [
        h(Select, {
          isClearable: true,
          isMulti: false,
          placeholder: 'Billing project',
          'aria-label': 'Filter by billing project',
          value: projectsFilter,
          hideSelectedOptions: true,
          onChange: data => setProjectsFilter(!!data ? data.value : undefined),
          options: _.flow(
            _.map('workspace.namespace'),
            _.uniq,
            _.sortBy(_.identity)
          )(workspaces)
        })
      ]),
      div({ style: { ...styles.filter, flex: '0 0 auto', minWidth: undefined } }, [
        h(Link, {
          onClick: () => {
            setFilter('')
            setProjectsFilter(undefined)
            setTagsFilter([])
          }
        }, ['Clear'])
      ])
    ]),
    div({
      role: 'radiogroup',
      style: styles.workspaceTilesContainer
    }, [
      _.flow(
        _.sortBy([
          ws => ws.workspace.workspaceId !== selectedWorkspaceId,
          ws => ws.workspace.namespace.toLowerCase(),
          ws => ws.workspace.name.toLowerCase()
        ]),
        _.map(w => {
          const { workspace: { workspaceId, namespace, name, lastModified, createdBy, attributes: { description } } } = w

          return div({
            key: workspaceId
          }, [
            h(Link, {
              role: 'radio',
              'aria-checked': workspaceId === selectedWorkspaceId,
              style: _.merge(styles.workspaceTile, workspaceId === selectedWorkspaceId ? styles.workspaceTileSelected : {}),
              onClick: () => setWorkspaceId(workspaceId),
              variant: workspaceId === selectedWorkspaceId ? 'light' : 'dark'
            }, [
              h3({
                style: { 'margin': '0 0 1rem 0' }
              }, [namespace + ' > ' + name]),
              div({
                style: { ...styles.tableCellContent }
              }, [
                description ? span({
                  style: {
                    ...Style.noWrapEllipsis,
                    color: workspaceId === selectedWorkspaceId ? colors.light(0.75) : colors.dark(0.75)
                  }
                }, [
                  description?.split('\n')[0] || 'No description added'
                ]) : null
              ]),
              div({
                style: { display: 'flex', flex: 'row nowrap', width: '100%', justifyContent: 'space-between' }
              }, [
                div({
                  style: {
                    color: workspaceId === selectedWorkspaceId ? colors.light(0.75) : colors.dark(0.75),
                    paddingTop: '1em',
                    flexFlow: '1 1 auto'
                  }
                }, [
                  span('Last Modified: '),
                  span([Utils.makeStandardDate(lastModified)])
                ]),
                div({
                  style: {
                    color: workspaceId === selectedWorkspaceId ? colors.light(0.75) : colors.dark(0.75),
                    paddingTop: '1em',
                    flexFlow: '1 1 auto'
                  }
                }, [
                  span('Created By: '),
                  span([createdBy])
                ])
              ])
            ])
          ])
        })
      )(filteredWorkspaces)
    ])
  ])

}

const CollectionSelectorPanel = _.flow(
  Utils.withDisplayName('CollectionSelectorPanel'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({ workspace, workspace: { workspace: { namespace, bucketName } }, onRequesterPaysError, selectedCollection, setCollection, children, ...props }) => {
  // State
  const [collections, setCollections] = useState(undefined)
  const [isLoading, setLoading] = useState(false)
  const [isCreating, setCreating] = useState(false)

  const signal = Utils.useCancellation()

  // Helpers
  const load = _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error loading bucket data'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const { prefixes } = await Ajax(signal).Buckets.list(namespace, bucketName, rootPrefix)
    setCollections(_.flow(
      // Slice off the root and the trailing slash
      _.map(p => p.slice(rootPrefix.length, p.length - 1)),
      _.concat(selectedCollection),
      _.uniq,
      _.compact,
      _.sortBy([p => p !== selectedCollection, p => p])
    )(prefixes))
  })

  // Lifecycle
  useEffect(() => {
    load()
  }, [])

  // Render

  return h(div, {}, [
    h2({ style: styles.heading }, [
      'Select a collection',
      h(Link, {
        'aria-label': 'Create new collection', onClick: () => setCreating(true),
        style: { marginLeft: '0.5rem' },
        tooltip: 'Create a new collection'
      },
      [icon('lighter-plus-circle', { size: 24 })])
    ]),
    p({ style: styles.instructions }, [
      'Each collection represents a group of files with a single metadata file describing the table structure. ',
      'You can create a new collection, or add files to an existing one. '
    ]),
    children,
    collections?.length > 0 && h3({}, ['Choose an existing collection']),
    div({
      role: 'radiogroup',
      style: styles.workspaceTilesContainer
    }, [
      _.map(prefix => {
        return div({
          key: prefix
        }, [
          h(Link, {
            role: 'radio',
            'aria-checked': prefix === selectedCollection,
            style: _.merge(styles.workspaceTile, prefix === selectedCollection ? styles.workspaceTileSelected : {}),
            onClick: () => setCollection(prefix),
            variant: prefix === selectedCollection ? 'light' : 'dark'
          }, [
            h4({
              style: { margin: '0 0 1rem 0' }
            }, [prefix])
          ])
        ])
      }, collections)
    ]),
    h(Link, {
      style: { margin: '2em 0 0 0', textAlign: 'center', width: '100%', display: 'block' },
      onClick: () => setCreating(true)
    }, [
      icon('plus'),
      ' Create a new collection'
    ]),
    isCreating && h(NameModal, {
      thing: 'Collection',
      onDismiss: () => setCreating(false),
      onSuccess: ({ name }) => setCollection(name)
    }),
    isLoading && topSpinnerOverlay
  ])
})

const DataUploadPanel = _.flow(
  Utils.withDisplayName('DataUploadPanel'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({ workspace, workspace: { workspace: { namespace, bucketName } }, onRequesterPaysError, collection, setHasFiles, children }) => {

  const basePrefix = `${rootPrefix}${collection}/`
  const [prefix, setPrefix] = useState('')

  const [prefixes, setPrefixes] = useState(undefined)
  const [objects, setObjects] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [deletingName, setDeletingName] = useState(undefined)
  const [viewingName, setViewingName] = useState(undefined)
  const [isCreating, setCreating] = useState(false)

  const [uploadingFiles, setUploadingFiles] = useState([])
  const [uploadStatus, setUploadStatus] = useUploader()

  const signal = Utils.useCancellation()
  const { signal: uploadSignal, abort: abortUpload } = Utils.useCancelable()

  // Helpers
  const getFullPrefix = (targetPrefix = prefix) => {
    const fullPrefix = targetPrefix.startsWith(basePrefix) ? targetPrefix : `${basePrefix}${targetPrefix}`
    return fullPrefix.endsWith('/') ? fullPrefix : `${fullPrefix}/`
  }

  const getBareFilename = name => {
    return name.startsWith(basePrefix) ? name.slice(basePrefix.length + prefix.length) : name
  }

  const load = _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error loading bucket data'),
    Utils.withBusyState(setLoading)
  )(async (targetPrefix = prefix) => {
    const { items, prefixes } = await Ajax(signal).Buckets.list(namespace, bucketName, getFullPrefix(targetPrefix))
    setPrefixes(_.flow(
      // Slice off the root
      _.map(p => p.slice(basePrefix.length)),
      _.uniq,
      _.compact
    )(prefixes))
    setObjects(items)

    // If there are any prefixes or items, we know this bucket has files in it
    if (prefixes || items) {
      setHasFiles(true)
    }
    // Otherwise, only report that there are no files if this is the base prefix.
    // If we didn't do this check, we could be in an empty inner folder but the outer folder could still have files.
    else if (targetPrefix === '' || targetPrefix === basePrefix) {
      setHasFiles(false)
    }
  })

  // Lifecycle
  useEffect(() => {
    load(prefix)
  }, [prefix, uploadStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    StateHistory.update({ prefix })
  }, [prefix])

  useEffect(() => {
    if (uploadingFiles.length > 0) {
      uploadFiles({
        namespace, bucketName,
        prefix: getFullPrefix(prefix),
        files: uploadingFiles,
        status: uploadStatus,
        setStatus: setUploadStatus,
        signal: uploadSignal
      })
    }
  }, [uploadingFiles])


  // Render

  // Get the folder prefix
  const prefixParts = _.compact(prefix.split('/'))
  const makeBucketLink = ({ label, target, onClick }) => h(Link, {
    style: { textDecoration: 'underline' },
    href: target ? `gs://${bucketName}/${target}` : undefined,
    onClick: e => {
      e.preventDefault()
      onClick()
    }
  }, [label])

  return h(Fragment, {}, [
    uploadStatus.active && h(UploadProgressModal, {
      status: uploadStatus,
      abort: abortUpload
    }),
    h2({ style: styles.heading }, ['Upload Your Data Files']),
    p({ style: styles.instructions }, [
      'Upload the files to associate with this collection by dragging them into the table below, or clicking the Upload button.'
    ]),
    p({ style: styles.instructions}, [
      ' You may upload as many files as you wish, but each filename must be unique even within sub-folders.'
    ]),
    children,
    h(Dropzone, {
      disabled: !!Utils.editWorkspaceError(workspace) || uploadStatus.active,
      style: {
        flexGrow: 1, backgroundColor: 'white', border: `1px solid ${colors.dark(0.55)}`,
        padding: '1rem', position: 'relative', minHeight: '10rem'
      },
      activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
      multiple: true,
      maxFiles: 0,
      onDropAccepted: setUploadingFiles
    }, [({ openUploader }) => h(Fragment, [
      div({
        style: { display: 'table', height: '100%' }
      }, [
        _.map(({ label, target }) => {
          return h(Fragment, { key: target }, [
            makeBucketLink({
              label, target: getFullPrefix(target),
              onClick: () => setPrefix(target)
            }),
            ' / '
          ])
        }, [
          { label: collection, target: '' },
          ..._.map(n => {
            return { label: prefixParts[n], target: _.map(s => `${s}/`, _.take(n + 1, prefixParts)).join('') }
          }, _.range(0, prefixParts.length))
        ]),
        makeBucketLink({
          label: span([icon('plus'), ' New folder']),
          onClick: () => setCreating(true)
        })
      ]),
      div({ style: { margin: '1rem -1rem 1rem -1rem', borderBottom: `1px solid ${colors.dark(0.25)}` } }),
      (prefixes?.length > 0 || objects?.length > 0) ? div({
        style: { fontSize: '1rem' }
      }, [
        h(SimpleTable, {
          columns: [
            { size: { basis: 24, grow: 0 }, key: 'button' },
            { header: h(HeaderCell, ['Name']), size: { grow: 1 }, key: 'name' },
            { header: h(HeaderCell, ['Size']), size: { basis: 200, grow: 0 }, key: 'size' },
            { header: h(HeaderCell, ['Last modified']), size: { basis: 200, grow: 0 }, key: 'updated' }
          ],
          rows: [
            ..._.map(p => {
              return {
                name: h(TextCell, [
                  makeBucketLink({
                    label: getBareFilename(p),
                    target: getFullPrefix(p),
                    onClick: () => setPrefix(p)
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
                    label: getBareFilename(name),
                    target: name,
                    onClick: () => setViewingName(name)
                  })
                ]),
                size: filesize(size, { round: 0 }),
                updated: Utils.makePrettyDate(updated)
              }
            }, objects)
          ]
        })
      ]): div({
        style: {
          color: colors.dark(0.75), width: '100%', margin: '4rem 0', textAlign: 'center',
          fontSize: '1.5em'
        }
      }, ['Drag and drop your files here']),
      deletingName && h(DeleteObjectModal, {
        workspace, name: deletingName,
        onDismiss: () => setDeletingName(),
        onSuccess: () => {
          setDeletingName()
          load(prefix)
        }
      }),
      viewingName && h(UriViewer, {
        googleProject: namespace, uri: `gs://${bucketName}/${viewingName}`,
        onDismiss: () => setViewingName(undefined)
      }),
      isCreating && h(NameModal, {
        thing: 'Folder',
        onDismiss: () => setCreating(false),
        onSuccess: ({ name }) => {
          setPrefix(`${prefix}${name}/`)
          setCreating(false)
        }
      }),
      !Utils.editWorkspaceError(workspace) && h(FloatingActionButton, {
        label: 'UPLOAD',
        iconShape: 'plus',
        onClick: openUploader
      }),
      (loading) && topSpinnerOverlay
    ])])
  ])
})

const MetadataUploadPanel = _.flow(
  Utils.withDisplayName('MetadataUploadPanel'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({ workspace, workspace: { workspace: { namespace, bucketName, name } },
   onRequesterPaysError, onSuccess, collection, children }) => {

  const basePrefix = `${rootPrefix}${collection}/`
  const [filesLoading, setFilesLoading] = useState(false)
  const [entitiesLoading, setEntitiesLoading] = useState(false)

  const [metadataFile, setMetadataFile] = useState(null)
  const [metadataTable, setMetadataTable] = useState(null)
  const [filenames, setFilenames] = useState({})
  const [activeMetadata, setActiveMetadata] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isUploading, setUploading] = useState(false)

  const setErrors = errors => {
    setMetadataTable({ errors })
  }

  const forceRefresh = () => {
    setRefreshKey(key => key++)
  }

  const isPreviewing = metadataTable?.rows?.length > 0
  const hasErrors = metadataTable?.errors?.length > 0

  const { initialX, initialY } = StateHistory.get() || {}

  const signal = Utils.useCancellation()

  // Get every filename in the bucket, so we can do substitutions
  useEffect(() => {
    _.flow(
      withRequesterPaysHandler(onRequesterPaysError),
      withErrorReporting('Error loading bucket data'),
      Utils.withBusyState(setFilesLoading)
    )(async () => {
      // Fetch every object in the entire bucket so we don't have to do it recursively, but then
      // filter out any that aren't in our base prefix
      const items = await Ajax(signal).Buckets.listAll(namespace, bucketName)

      // Hash the filenames without any prefixes for easy lookup
      setFilenames(_.flow(
        _.filter(item => item.name.startsWith(basePrefix)),
        _.map(item => [ _.last(item.name.split('/')), `gs://${bucketName}/${item.name}` ]),
        _.fromPairs
      )(items))
    })()
  }, [collection]) // eslint-disable-line react-hooks/exhaustive-deps

  const parseMetadata = async (file) => {
    if (!file) {
      setMetadataTable(null)
      return
    }
    const errors = [];

    try {
      // Read the file contents
      const text = await readFileAsText(file)

      // Split rows by newlines and columns by tabs
      const rows = _.flow(
        _.split(/\r\n|\r|\n/),
        _.compact,
        _.map(row => row.split('\t'))
      )(text)

      const headerRow = _.first(rows)
      const idColumn = _.first(headerRow)
      let otherRows = _.drop(1, rows)

      // Perform validation on the first row
      if (!idColumn) {
        errors.push(['This does not look like a valid .tsv file.'])
        // Return right away
        setErrors(errors)
        return
      }
      const entityTypes = _.map(t => `${t}:`, supportedEntityTypes)

      if (!_.some(t => idColumn.startsWith(t), entityTypes)) {
        errors.push(div(['The first column header ', code(idColumn), ' must start with ', code(Utils.commaJoin(entityTypes))]))
      }
      if (!idColumn.endsWith('_id')) {
        errors.push(div(['The first column header ', code(idColumn), ' must end with ', code('_id')]))
      }
      const matches = idColumn?.match(/^([A-Za-z_-]+):([A-Za-z0-9-_.]+)_id$/)
      if (errors.length === 0 && !matches) {
        errors.push(div(['The first column header ', code(idColumn), ' must only include alphanumeric characters, dashes, periods or underscores']))
      }
      if (headerRow.length < 2) {
        errors.push('Your metadata file must include at least 2 columns')
      }

      if (errors.length > 0) {
        setErrors(errors)
      }
      else {
        const entityClass = matches[1]
        const entityType = matches[2]
        const idName = `${entityType}_id`

        // Process each row
        otherRows = _.map(row => {
          return _.flow(
            // Pad all rows to the same length as the header, or else the import will fail
            (row) => _.concat(row, _.map(() => '', _.range(0, headerRow.length - row.length))),
            // Replace any file references with bucket paths
            _.map(cell => {
              return cell in filenames ? filenames[cell] : cell
            })
          )(row)
        }, otherRows)

        setMetadataTable({ errors, entityClass, entityType, idName, idColumn, columns: headerRow, rows: otherRows })
      }
    }
    catch (e) {
      console.error('Failed to parse metadata file', e)
      setErrors(['We were unable to process the metadata file. Are you sure it is in the proper format?'])
    }
  }

  const renameTable = ({name}) => {
    setMetadataTable(m => {
      const idColumn = `${m.entityClass}:${name}_id`
      return {
        ...m,
        entityType: name,
        idName: `${name}_id`,
        idColumn: idColumn,
        columns: [idColumn, ..._.drop(1, m.columns)]
      }
    })
  }

  // Parse the metadata TSV file so we can show a preview. Refresh this parsing anytime the filenames or entities change
  useEffect(() => {
    parseMetadata(metadataFile)
  }, [metadataFile, filenames])

  const doUpload = _.flow(
    Utils.withBusyState(setUploading)
  )(async (metadata) => {
    try {
      // Convert the table data structure back into a TSV, in case the user made changes
      const file = Utils.makeTSV([metadata.table.columns, ...metadata.table.rows])
      const workspace = Ajax().Workspaces.workspace(namespace, name)
      await workspace.importFlexibleEntitiesFile(file)
      onSuccess && onSuccess({ file, metadata })
    } catch (error) {
      await reportError('Failed to upload entity metadata', error)
    }
  })

  // Render

  return h(Fragment, {}, [
    h2({ style: styles.heading }, ['Upload Your Metadata Files']),
    div({ style: styles.instructions }, [
      p('Upload a tab-separated file describing your table structures.'),
      ul([
        li('Any columns which reference files should include just the filenames, which will be matched up to the data files in this collection.'),
        li([
          p([
            'The first column must contain the unique identifiers for each row. The name of the first column must start with ',
            code('entity:'), ' followed by the table name, followed by ', code('_id'), '.'
          ]),
        ]),
      ]),
      p([
        'For example, if the first column is named ',
        code('entity:sample_id'),
        ', a table named "sample" will be created with "sample_id" as its first column. There are no restrictions on other columns.'
      ]),
    ]),
    children,
    !isPreviewing && h(Dropzone, {
      disabled: !!Utils.editWorkspaceError(workspace),
      style: {
        flexGrow: 1, backgroundColor: 'white', border: `1px dashed ${colors.dark(0.55)}`,
        padding: '1rem', position: 'relative', height: '7rem'
      },
      activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
      multiple: false,
      maxFiles: 1,
      accept: '.tsv',
      onDropAccepted: ([file]) => {
        setMetadataFile(file)
      },
      onDropRejected: (errors) => {
        const e = _.flatMap(error => {
          return _.map(e => e.message, error.errors)
        }, errors)
        setMetadataTable({ errors: e })
      }
    }, [
      ({ openUploader }) => h(Fragment, [
        div({
          style: {
            color: colors.dark(0.75), width: '100%', margin: '2rem 0', textAlign: 'center',
            fontSize: '1.5em'
          }
        }, ['Drag and drop your metadata .tsv file here']),
        !Utils.editWorkspaceError(workspace) && h(FloatingActionButton, {
          label: 'UPLOAD',
          iconShape: 'plus',
          onClick: openUploader
        })
      ])
    ]),
    hasErrors && div({
      style: { color: colors.danger() }
    }, [
      h2(['Error!']),
      p('The following errors occurred. Please correct them and then try your upload again.'),
      ul([
        _.map(e => li({ key: e, }, [e]), metadataTable.errors)
      ])
    ]),
    isPreviewing && div({
      style: { borderTop: '1px solid', borderColor: colors.dark(0.75) }
    }, [
      h(UploadPreviewTable, {
        workspace, metadataTable,
        onConfirm: ({metadata}) => {
          doUpload(metadata)
        },
        onCancel: () => {
          setMetadataFile(null)
          setMetadataTable(null)
        },
        onRename: renameTable
      })
    ]),
    (filesLoading) && topSpinnerOverlay
  ])
})

const UploadData = _.flow(
  Utils.forwardRefWithName('Upload')
)((props, ref) => {
  const { workspaces, refresh: refreshWorkspaces, loading: loadingWorkspaces } = useWorkspaces()

  // State
  const [currentStep, setCurrentStep] = useState(StateHistory.get().currentStep || 'workspaces')
  const [collection, setCollection] = useState(StateHistory.get().collection)
  const [workspaceId, setWorkspaceId] = useStaticStorageSlot(localStorage, 'uploadWorkspace')
  const [creatingNewWorkspace, setCreatingNewWorkspace] = useState(false)
  const [hasFiles, setHasFiles] = useState(StateHistory.get().hasFiles)
  const [tableName, setTableName] = useState(StateHistory.get().tableName)

  useEffect(() => {
    StateHistory.update({ currentStep, workspaceId, collection, hasFiles, tableName })
  }, [currentStep, workspaceId, collection, hasFiles, tableName])

  const workspace = useMemo(() => {
    return workspaceId ? _.find({ workspace: { workspaceId: workspaceId } }, workspaces) : null
  }, [workspaces, workspaceId])

  // Steps through the wizard
  const steps = [
    { step: 'workspaces', test: () => true },
    { step: 'collection', test: () => workspace },
    { step: 'data', test: () => collection },
    { step: 'metadata', test: () => hasFiles },
    { step: 'done', test: () => tableName },
  ]

  const stepIsEnabled = (step) => {
    const s = _.find({ step }, steps)
    return s && s.test()
  }

  // Make sure we have a valid step once the workspaces have finished loading
  if (!stepIsEnabled(currentStep) && !loadingWorkspaces) {
    const step = _.findLast((step) => step.test(), steps)
    setCurrentStep(step?.step || 'workspaces')
  }

  // Reset subsequent actions if an earlier dependency changes
  /*
  useEffect(() => {
    setCollection(null)
  }, [workspaceId])
  useEffect(() => {
    setHasFiles(false)
  }, [collection])
  useEffect(() => {
    setTableName(null)
  }, [hasFiles])
   */

  const filteredWorkspaces = useMemo(() => {
    return _.filter(ws => {
      return Utils.canWrite(ws.accessLevel) // && (!ad || _.some({ membersGroupName: ad }, ws.workspace.authorizationDomain))
    }, workspaces)
  }, [workspaces])

  // Render
  return h(FooterWrapper, [
    h(TopBar, { title: 'Data Uploader', href: Nav.getLink('upload') }, [
      workspace && WorkspaceBreadcrumbHeader({ workspace, tab: 'data' })
    ]),
    div({ role: 'main', style: { padding: '1.5rem', flex: 1, fontSize: '1.2em' } }, [
      filteredWorkspaces.length === 0 && !loadingWorkspaces ?
        h(NoWorkspacesMessage, { onClick: () => setCreatingNewWorkspace(true) }) :
        div({ style: styles.pageContainer }, [
          div({ style: styles.dataTypeSelectionPanel }, [
            h(DataTypeSection, {
              currentStep, setCurrentStep, stepIsEnabled,
              step: 'workspaces',
              icon: icon('view-cards', { size: 20, style: { marginLeft: '1rem', marginRight: '1rem' } }),
              title: 'Workspace'
            }),
            h(DataTypeSection, {
              currentStep, setCurrentStep, stepIsEnabled,
              step: 'collection',
              icon: icon('folder', { size: 20, style: { marginLeft: '1rem', marginRight: '1rem' } }),
              title: 'Collection'
            }),
            h(DataTypeSection, {
              currentStep, setCurrentStep, stepIsEnabled,
              step: 'data',
              icon: icon('fileAlt', { size: 20, style: { marginLeft: '1rem', marginRight: '1rem' } }),
              title: 'Data Files'
            }),
            h(DataTypeSection, {
              currentStep, setCurrentStep, stepIsEnabled,
              step: 'metadata',
              icon: icon('listAlt', { size: 20, style: { marginLeft: '1rem', marginRight: '1rem' } }),
              title: 'Table Metadata'
            })
          ]),
          div({ style: styles.tableViewPanel }, [
            Utils.switchCase(currentStep,
              ['workspaces', () => div({
                style: styles.tabPanelHeader
              }, [
                h(WorkspaceSelectorPanel, {
                  workspaces: filteredWorkspaces,
                  selectedWorkspaceId: workspaceId,
                  setCreatingNewWorkspace,
                  setWorkspaceId: (id) => {
                    // If the users switches to a different workspace, clear out whatever collection they had selected
                    if (workspaceId !== id) {
                      setCollection(null)
                      setHasFiles(false)
                    }
                    setWorkspaceId(id)
                    setCurrentStep('collection')
                  }
                }, [
                  h(NextLink, { step: 'collection', setCurrentStep, stepIsEnabled })
                ])
              ])],
              ['collection', () => div({
                style: styles.tabPanelHeader
              }, [
                workspace && h(CollectionSelectorPanel, {
                  workspace: workspace,
                  selectedCollection: collection,
                  setCollection: (id) => {
                    setCollection(id)
                    setCurrentStep('data')
                  }
                }, [
                  h(PrevLink, { step: 'workspaces', setCurrentStep }),
                  h(NextLink, { step: 'data', setCurrentStep, stepIsEnabled })
                ])
              ])],
              ['data', () => div({
                style: styles.tabPanelHeader
              }, [
                workspace && collection && h(DataUploadPanel, {
                  workspace: workspace,
                  collection: collection,
                  setHasFiles,
                  setUploadedFiles: (files) => {
                    setUploadedFiles(files)
                    setCurrentStep('metadata')
                  }
                }, [
                  h(PrevLink, { step: 'collection', setCurrentStep }),
                  h(NextLink, { step: 'metadata', setCurrentStep, stepIsEnabled })
                ])
              ])],
              ['metadata', () => div({
                style: styles.tabPanelHeader
              }, [
                workspace && collection && h(MetadataUploadPanel, {
                  workspace: workspace,
                  collection: collection,
                  onSuccess: ({ metadata: {entityType: tableName } }) => {
                    setTableName(tableName)
                    setCurrentStep('done')
                  }
                }, [
                  h(PrevLink, { step: 'collection', setCurrentStep }),
                ])
              ])],
              ['done', () => div({
                style: styles.tabPanelHeader
              }, [
                h2('Done!')
              ])]
            )
          ]),
          creatingNewWorkspace && h(NewWorkspaceModal, {
            onDismiss: () => setCreatingNewWorkspace(false),
            onSuccess: ({ namespace, name }) => refreshWorkspaces(),
          }),
          loadingWorkspaces && (!workspaces ? transparentSpinnerOverlay : topSpinnerOverlay)
        ])
    ])
  ])
})

export const navPaths = [
  {
    name: 'upload',
    path: '/upload',
    component: UploadData,
    title: `Upload`
  }
]
