import filesize from 'filesize'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { div, h, h2, h3, h4, li, p, span, ul } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { ButtonPrimary, IdContainer, Link, Select, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import FloatingActionButton from 'src/components/FloatingActionButton'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import { DelayedSearchInput, ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { UploadProgressModal } from 'src/components/ProgressBar'
import { HeaderCell, SimpleTable, TextCell } from 'src/components/table'
import TopBar from 'src/components/TopBar'
import UriViewer from 'src/components/UriViewer'
import { NoWorkspacesMessage, useWorkspaces, WorkspaceTagSelect } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { useStaticStorageSlot } from 'src/libs/browser-storage'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { uploadFiles, useUploader } from 'src/libs/uploads'
import * as Utils from 'src/libs/utils'
import { DeleteObjectModal } from 'src/pages/workspaces/workspace/Data'


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
    textAlign: 'center'
  },
  instructions: {
    fontSize: '1.2em',
    textAlign: 'center'
  },
  nextLink: {
    fontSize: '1.2em',
    position: 'absolute',
    right: 0,
    top: 0,
    padding: '1rem 0'
  },
  prevLink: {
    fontSize: '1.2em',
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

const NewDatasetModal = ({ onSuccess, onDismiss }) => {
  const [name, setName] = useState('')

  return h(Modal, {
    title: 'Create a New Dataset',
    onDismiss,
    okButton: h(ButtonPrimary, {
      onClick: () => onSuccess({ name })
    }, ['Create Dataset'])
  }, [
    h(IdContainer, [
      id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Dataset name']),
        h(ValidatedInput, {
          inputProps: {
            id,
            autoFocus: true,
            placeholder: 'Enter a name',
            value: name,
            onChange: v => setName(v)
          }
        })
      ])
    ])
  ])
}

const NewFolderModal = ({ onSuccess, onDismiss }) => {
  const [name, setName] = useState('')

  return h(Modal, {
    title: 'Add a New Folder',
    onDismiss,
    okButton: h(ButtonPrimary, {
      onClick: () => onSuccess({ name })
    }, ['Create Folder'])
  }, [
    h(IdContainer, [
      id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Folder name']),
        h(ValidatedInput, {
          inputProps: {
            id,
            autoFocus: true,
            placeholder: 'Enter a name',
            value: name,
            onChange: v => setName(v)
          }
        })
      ])
    ])
  ])
}


const WorkspaceSelectorPanel = ({
                                  workspaces, selectedWorkspaceId, setWorkspaceId, setCurrentStep, stepIsEnabled, setCreatingNewWorkspace, children,
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

const DatasetSelectorPanel = _.flow(
  Utils.withDisplayName('DatasetSelectorPanel'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({ workspace, workspace: { workspace: { namespace, bucketName } }, onRequesterPaysError, selectedDataset, setDataset, children, ...props }) => {
  // State
  const [datasets, setDatasets] = useState(undefined)
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
    setDatasets(_.flow(
      // Slice off the root and the trailing slash
      _.map(p => p.slice(rootPrefix.length, p.length - 1)),
      _.concat(selectedDataset),
      _.uniq,
      _.compact,
      _.sortBy([p => p !== selectedDataset, p => p])
    )(prefixes))
  })

  // Lifecycle
  useEffect(() => {
    load()
  }, [])

  // Render

  return h(div, {}, [
    h2({ style: styles.heading }, ['Select a dataset']),
    p({ style: styles.instructions }, [
      'Each dataset represents a collection of file with a single metadata file describing the table structure. ',
      'You can create a new dataset, or add files to an existing one. '
    ]),
    children,
    datasets?.length > 0 && h3({}, ['Choose an existing dataset']),
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
            'aria-checked': prefix === selectedDataset,
            style: _.merge(styles.workspaceTile, prefix === selectedDataset ? styles.workspaceTileSelected : {}),
            onClick: () => setDataset(prefix),
            variant: prefix === selectedDataset ? 'light' : 'dark'
          }, [
            h4({
              style: { margin: '0 0 1rem 0' }
            }, [prefix])
          ])
        ])
      }, datasets)
    ]),
    h(Link, {
      style: { fontSize: '1.2em' },
      onClick: () => setCreating(true)
    }, [
      icon('plus'),
      ' Create a new dataset'
    ]),
    isCreating && h(NewDatasetModal, {
      onDismiss: () => setCreating(false),
      onSuccess: ({ name }) => setDataset(name)
    }),
    isLoading && topSpinnerOverlay
  ])
})

const DataUploadPanel = _.flow(
  Utils.withDisplayName('DataUploadPanel'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({ workspace, workspace: { workspace: { namespace, bucketName } }, onRequesterPaysError, dataset, setCurrentStep, setUploadFiles, children }) => {

  const basePrefix = `${rootPrefix}${dataset}/`
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
      'Upload the files to associate with this dataset. You may upload as many files as you wish, but each filename must be unique.'
    ]),
    children,
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
            makeBucketLink({
              label, target: getFullPrefix(target),
              onClick: () => setPrefix(target)
            }),
            ' / '
          ])
        }, [
          { label: dataset, target: '' },
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
      }),
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
      isCreating && h(NewFolderModal, {
        onDismiss: () => setCreating(false),
        onSuccess: ({name}) => {
          setPrefix(`${name}/`)
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

const UploadData = _.flow(
  Utils.forwardRefWithName('Upload')
)((props, ref) => {
  const { workspaces, refresh: refreshWorkspaces, loading: loadingWorkspaces } = useWorkspaces()

  // State
  const [currentStep, setCurrentStep] = useState(StateHistory.get().currentStep || 'workspaces')
  const [dataset, setDataset] = useState(StateHistory.get().dataset)
  const [workspaceId, setWorkspaceId] = useStaticStorageSlot(localStorage, 'uploadWorkspace')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [creatingNewWorkspace, setCreatingNewWorkspace] = useState(false)

  useEffect(() => {
    // Make sure we have a valid step once the workspaces have finished loading
    if (!stepIsEnabled(currentStep) && !loadingWorkspaces) {
      const step = _.findLast((step) => step.test(), steps)
      setCurrentStep(step?.step || 'workspaces')
    } else {
      StateHistory.update({ currentStep, workspaceId, dataset })
    }
  }, [currentStep, workspaceId, dataset])

  // Steps through the wizard
  const steps = [
    { step: 'workspaces', test: () => true },
    { step: 'dataset', test: () => workspace },
    { step: 'data', test: () => dataset },
    { step: 'metadata', test: () => uploadedFiles.length }
  ]

  const stepIsEnabled = (step) => {
    const s = _.find({ step }, steps)
    return s && s.test()
  }

  const filteredWorkspaces = useMemo(() => {
    return _.filter(ws => {
      return Utils.canWrite(ws.accessLevel) // && (!ad || _.some({ membersGroupName: ad }, ws.workspace.authorizationDomain))
    }, workspaces)
  }, [workspaces])

  const workspace = useMemo(() => {
    return workspaceId ? _.find({ workspace: { workspaceId: workspaceId } }, workspaces) : null
  }, [workspaces, workspaceId])

  // Render
  return h(FooterWrapper, [
    h(TopBar, { title: 'Data Uploader', href: Nav.getLink('upload') }, [
      //      selectedWorkspace && WorkspaceBreadcrumbHeader({ workspace: selectedWorkspace })
    ]),
    div({ role: 'main', style: { padding: '1.5rem', flex: 1 } }, [
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
              step: 'dataset',
              icon: icon('folder', { size: 20, style: { marginLeft: '1rem', marginRight: '1rem' } }),
              title: 'Dataset'
            }),
            h(DataTypeSection, {
              currentStep, setCurrentStep, stepIsEnabled,
              step: 'data',
              icon: icon('folder', { size: 20, style: { marginLeft: '1rem', marginRight: '1rem' } }),
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
                  setCurrentStep,
                  setCreatingNewWorkspace,
                  setWorkspaceId: (id) => {
                    setWorkspaceId(id)
                    setCurrentStep('dataset')
                  }
                }, [
                  h(NextLink, { step: 'dataset', setCurrentStep, stepIsEnabled })
                ])
              ])],
              ['dataset', () => div({
                style: styles.tabPanelHeader
              }, [
                workspace && h(DatasetSelectorPanel, {
                  workspace: workspace,
                  selectedDataset: dataset,
                  setCurrentStep,
                  setDataset: (id) => {
                    setDataset(id)
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
                workspace && dataset && h(DataUploadPanel, {
                  workspace: workspace,
                  dataset: dataset,
                  setCurrentStep,
                  setUploadedFiles: (files) => {
                    setUploadedFiles(files)
                    setCurrentStep('metadata')
                  }
                }, [
                  h(PrevLink, { step: 'dataset', setCurrentStep }),
                  h(NextLink, { step: 'metadata', setCurrentStep, stepIsEnabled })
                ])
              ])],
              ['metadata', () => div({}, [
                'Upload Table Metadata'
              ])]
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
