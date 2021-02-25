import filesize from 'filesize'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useState, useEffect, useMemo, useReducer } from 'react'
import { div, h, h2, h3, li, p, span, ul } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { Clickable, Link, Select, spinnerOverlay, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import FloatingActionButton from 'src/components/FloatingActionButton'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon, spinner } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { ProgressBar, UploadProgressModal } from 'src/components/ProgressBar'
import { HeaderCell, SimpleTable, TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import UriViewer from 'src/components/UriViewer'
import { NoWorkspacesMessage, useWorkspaces, WorkspaceBreadcrumbHeader, WorkspaceTagSelect } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { staticStorageSlot } from 'src/libs/browser-storage'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { pfbImportJobStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { uploadFiles, uploadFilesReducer, useUploader } from 'src/libs/uploads'
import { useStore } from 'src/libs/utils'
import * as Utils from 'src/libs/utils'
import { DeleteObjectModal } from 'src/pages/workspaces/workspace/Data'


const localVariables = 'localVariables'
const bucketObjects = '__bucket_objects__'

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
    backgroundColor: colors.accent(),
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
    minHeight: '125px',
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
    textAlign: 'center'
  },
  instructions: {
    fontSize: '1.2em',
    textAlign: 'center',
  },
  nextLink: {
    fontSize: '1.2em',
    position: 'absolute',
    right: 0,
    top: 0,
    padding: '1rem 0',
  },
  prevLink: {
    fontSize: '1.2em',
    position: 'absolute',
    left: 0,
    top: 0,
    padding: '1rem 0',
  },
  filter: { marginRight: '1rem', flex: '1 0 auto', minWidth: '10em' }
}

const DataTypeSection = ({ title, icon, disabled, active, onClick, children, ...props }) => {
  return div({
    style: _.merge(Style.navList.heading, active ? styles.dataTypeActive : null)
  }, [
    h(Link, {
      disabled: disabled,
      onClick: onClick,
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

const DataImportPlaceholder = () => {
  return div({ style: { ...Style.navList.item(false), color: colors.dark(0.7) } }, [
    div({ style: { flex: 'none', display: 'flex', width: '1.5rem' } }, [
      icon('downloadRegular', { size: 14 })
    ]),
    div({ style: { flex: 1 } }, ['Data import in progress'])
  ])
}

const WorkspaceSelectorPanel = ({ workspaces, value, onChange, disabled, ...props }) => {
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
      _.every(a => _.includes(a, _.get(['tag:tags', 'items'], attributes)), tagsFilter);
  }, workspaces), [workspaces, filter, projectsFilter, tagsFilter])

  return div([
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
    ul({
      style: styles.workspaceTilesContainer
    }, [
      _.flow(
        _.sortBy(ws => ws.workspace.name.toLowerCase()),
        _.map(w => {
          const { workspace: { workspaceId, namespace, name, lastModified, createdBy, attributes: { description } } } = w

          return li({
            key: workspaceId,
          }, [
            h(Link, {
              role: 'radio',
              'aria-selected': workspaceId === value,
              style: _.merge(styles.workspaceTile, workspaceId === value ? styles.workspaceTileSelected : {}),
              onClick: () => onChange(workspaceId),
              disabled: disabled,
              variant: workspaceId === value ? 'light' : 'dark'
            }, [
              h3([
                namespace,
                ' > ',
                name
              ]),
              div({
                style: {
                  ...styles.tableCellContent,
                }
              }, [
                description ? span({
                  style: {
                    ...Style.noWrapEllipsis,
                    color: workspaceId === value ? colors.light(0.75) : colors.dark(0.75)
                  }
                }, [
                  description?.split('\n')[0] || 'No description added'
                ]) : null
              ]),
              div({
                style: { display: 'flex', flex: 'row nowrap', width: '100%', justifyContent: 'space-between'}
              }, [
                div({
                  style: {
                    color: workspaceId === value ? colors.light(0.75) : colors.dark(0.75),
                    paddingTop: '1em',
                    flexFlow: '1 1 auto'
                  }
                }, [
                  span('Last Modified: '),
                  span([Utils.makeStandardDate(lastModified)])
                ]),
                div({
                  style: {
                    color: workspaceId === value ? colors.light(0.75) : colors.dark(0.75),
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

const DataUploadPanel = _.flow(
  Utils.withDisplayName('BucketContent'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({
     workspace, workspace: { workspace: { namespace, bucketName } }, firstRender, refreshKey,
     onRequesterPaysError, onFileUploaded, onFilesUploaded
   }) => {
  // State
  const [prefix, setPrefix] = useState('')
  const [prefixes, setPrefixes] = useState(undefined)
  const [objects, setObjects] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [deletingName, setDeletingName] = useState(undefined)
  const [viewingName, setViewingName] = useState(undefined)

  const [uploadingFiles, setUploadingFiles] = useState([])
  const [uploadStatus, setUploadStatus] = useUploader()
  const signal = Utils.useCancellation()

  const { signal: uploadSignal, abort: abortUpload } = Utils.useCancelable();

  // Helpers
  const load = _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error loading bucket data'),
    Utils.withBusyState(setLoading)
  )(async (targetPrefix = prefix) => {
    const { items, prefixes } = await Ajax(signal).Buckets.list(namespace, bucketName, targetPrefix)
    setPrefix(targetPrefix)
    setPrefixes(prefixes)
    setObjects(items)
  })

  // Lifecycle
  useEffect(() => {
    load(firstRender ? undefined : '')
  }, [refreshKey, uploadStatus.currentFileNum]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    StateHistory.update({ objects, prefix })
  }, [objects, prefix])

  useEffect(() => {
    if (uploadingFiles.length > 0) {
      uploadFiles({
        namespace, bucketName, prefix,
        files: uploadingFiles,
        status: uploadStatus,
        setStatus: setUploadStatus,
        signal: uploadSignal
      })
    }
  }, [uploadingFiles]);


  // Render
  const prefixParts = _.dropRight(1, prefix.split('/'))
  const makeBucketLink = ({ label, target, onClick }) => h(Link, {
    style: { textDecoration: 'underline' },
    href: target,
    onClick: e => {
      e.preventDefault()
      onClick()
    }
  }, [label])

  return h(Fragment, {}, [

    uploadStatus.active && h(UploadProgressModal, {
      status: uploadStatus,
      abort: abortUpload,
    }),
    h(Dropzone, {
      disabled: !!Utils.editWorkspaceError(workspace) || uploadStatus.active,
      style: { flexGrow: 1, backgroundColor: 'white', border: `1px solid ${colors.dark(0.55)}`, padding: '1rem', position: 'relative' },
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
            makeBucketLink({ label, target, onClick: () => load(target) }),
            ' / '
          ])
        }, [
          { label: 'Files', target: '' },
          ..._.map(n => {
            return { label: prefixParts[n], target: _.map(s => `${s}/`, _.take(n + 1, prefixParts)).join('') }
          }, _.range(0, prefixParts.length))
        ])
      ]),
      div({ style: { margin: '1rem -1rem 1rem -1rem', borderBottom: `1px solid ${colors.dark(0.25)}` } }),
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
                  label: p.slice(prefix.length),
                  target: `gs://${bucketName}/${p}`,
                  onClick: () => load(p)
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
                  onClick: () => setViewingName(name)
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
        googleProject: namespace, uri: `gs://${bucketName}/${viewingName}`,
        onDismiss: () => setViewingName(undefined)
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

const headerBreadcrumbs = ({ workspace: { namespace, name }}) => {

}

const UploadData = _.flow(
  Utils.forwardRefWithName('Upload')
)((props, ref) => {
  const { workspaces, refresh: refreshWorkspaces, loading: loadingWorkspaces } = useWorkspaces()

  // State
  const [firstLoad, setFirstLoad] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [currentStep, setCurrentStep] = useState(StateHistory.get().currentStep || 'workspaces')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [creatingNewWorkspace, setCreatingNewWorkspace] = useState(false)

  const workspaceStore = staticStorageSlot(localStorage, 'uploadWorkspace')
  const selectedWorkspaceId = Utils.useStore(workspaceStore)
  const setSelectedWorkspaceId = (id) => workspaceStore.set(id)

  const signal = Utils.useCancellation()
  const pfbImportJobs = Utils.useStore(pfbImportJobStore)

  // Steps through the wizard
  const steps = {
    'workspaces': () => true,
    'data': () => selectedWorkspace,
    'metadata': () => uploadedFiles.length
  }
  const stepIsEnabled = (step) => {
    return step in steps && steps[step]()
  }

  const filteredWorkspaces = useMemo(() => {
    return _.filter(ws => {
      return Utils.canWrite(ws.accessLevel) // && (!ad || _.some({ membersGroupName: ad }, ws.workspace.authorizationDomain))
    }, workspaces)
  }, [workspaces]);

  const selectedWorkspace = useMemo(() => {
    return selectedWorkspaceId ? _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces) : null
  }, [workspaces, selectedWorkspaceId]);

  // Lifecycle
  useEffect(() => {
    StateHistory.update({currentStep, selectedWorkspaceId})

    // Make sure we have a valid step
    if (!stepIsEnabled(currentStep)) {
      setCurrentStep('workspaces');
    }
  }, [currentStep, selectedWorkspaceId])

  // Render
  return h(FooterWrapper, [
    h(TopBar, { title: 'Data Uploader', href: Nav.getLink('upload') }, [
      selectedWorkspace && WorkspaceBreadcrumbHeader({ workspace: selectedWorkspace })
    ]),
    div({ role: 'main', style: { padding: '1.5rem', flex: 1 } }, [
      filteredWorkspaces.length === 0 && !loadingWorkspaces ?
        h(NoWorkspacesMessage,{ onClick: () => setCreatingNewWorkspace(true) }) :
        div({ style: styles.pageContainer }, [
          div({ style: styles.dataTypeSelectionPanel }, [
            h(DataTypeSection,  {
              active: currentStep === 'workspaces',
              disabled: !stepIsEnabled('workspaces'),
              onClick: () => setCurrentStep('workspaces'),
              icon: icon('view-cards', { size: 20, style: { marginLeft: '1rem', marginRight: '1rem' } }),
              title: 'Workspaces',
            }),
            h(DataTypeSection, {
              active: currentStep === 'data',
              disabled: !stepIsEnabled('data'),
              onClick: () => setCurrentStep('data'),
              icon: icon('folder', { size: 20, style: { marginLeft: '1rem', marginRight: '1rem' } }),
              title: 'Data Files'
            }),
            h(DataTypeSection, {
              active: currentStep === 'metadata',
              disabled: !stepIsEnabled('metadata'),
              onClick: () => setCurrentStep('metadata'),
              icon: icon('listAlt', { size: 20, style: { marginLeft: '1rem', marginRight: '1rem' } }),
              title: 'Table Metadata'
            })
          ]),
          div({ style: styles.tableViewPanel }, [
            Utils.switchCase(currentStep,
              ['workspaces', () => div({
                style: styles.tabPanelHeader
              }, [
                h2({ style: styles.heading }, [
                  'Select a Workspace',
                  h(Link, {
                      'aria-label': 'Create new workspace', onClick: () => setCreatingNewWorkspace(true),
                      style: { marginLeft: '0.5rem' },
                      tooltip: 'Create a new workspace'
                    },
                    [icon('lighter-plus-circle', { size: 24 })])
                ]),
                p( { style: styles.instructions }, [
                  'You must first select the workspace you wish to upload your files into. You have access to the following workspaces:'
                ]),
                h(Link, {
                  style: styles.nextLink,
                  disabled: !stepIsEnabled('data'),
                  onClick: () => setCurrentStep('data')
                }, ['Next >']),
                h(WorkspaceSelectorPanel, {
                  workspaces: filteredWorkspaces,
                  value: selectedWorkspaceId,
                  onChange: (id) => {
                    setSelectedWorkspaceId(id)
                    setCurrentStep('data')
                  }
                })
              ])],
              ['data', () => div({
                style: styles.tabPanelHeader,
              }, [
                h2({ style: styles.heading }, ['Upload Your Data Files']),
                p( { style: styles.instructions }, [
                  'Upload the files to associate with a single table. You may upload as many files as you wish.'
                ]),
                h(Link, {
                  style: styles.prevLink,
                  onClick: () => setCurrentStep('workspaces'),
                }, ['< Previous']),
                h(Link, {
                  style: styles.nextLink,
                  disabled: !stepIsEnabled('metadata'),
                  onClick: () => setCurrentStep('metadata'),
                }, ['Next >']),
                h(DataUploadPanel, {
                  workspace: selectedWorkspace,
                  firstLoad,
                  refreshKey
                })
              ])],
              ['metadata', () => div({}, ['Upload Table Metadata'])]
            )
          ]),
          creatingNewWorkspace && h(NewWorkspaceModal, {
            onDismiss: () => setCreatingNewWorkspace(false),
            onSuccess: ({ namespace, name }) => refreshWorkspaces()
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
