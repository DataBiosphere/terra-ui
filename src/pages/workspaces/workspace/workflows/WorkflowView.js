import FileSaver from 'file-saver'
import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { b, div, h, label, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import {
  ButtonPrimary, ButtonSecondary, Clickable, GroupedSelect, IdContainer, LabeledCheckbox, Link, makeMenuIcon, MenuButton, methodLink, RadioButton,
  Select, spinnerOverlay
} from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { centeredSpinner, icon } from 'src/components/icons'
import { DelayedAutocompleteTextArea, DelayedSearchInput } from 'src/components/input'
import { MarkdownViewer } from 'src/components/markdown'
import Modal from 'src/components/Modal'
import PopupTrigger, { InfoBox } from 'src/components/PopupTrigger'
import StepButtons from 'src/components/StepButtons'
import { HeaderCell, SimpleFlexTable, SimpleTable, Sortable, TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import WDLViewer from 'src/components/WDLViewer'
import { Ajax } from 'src/libs/ajax'
import colors, { terraSpecial } from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { workflowSelectionStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import DataStepContent from 'src/pages/workspaces/workspace/workflows/DataStepContent'
import DeleteWorkflowModal from 'src/pages/workspaces/workspace/workflows/DeleteWorkflowModal'
import {
  chooseRows, chooseSetComponents, chooseSets, processAll, processAllAsSet, processMergedSet, processSnapshotTable
} from 'src/pages/workspaces/workspace/workflows/EntitySelectionType'
import ExportWorkflowModal from 'src/pages/workspaces/workspace/workflows/ExportWorkflowModal'
import LaunchAnalysisModal from 'src/pages/workspaces/workspace/workflows/LaunchAnalysisModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const sideMargin = '3rem'

const miniMessage = text => span({ style: { fontWeight: 500, fontSize: '75%', marginRight: '1rem', textTransform: 'uppercase' } }, [text])

const augmentErrors = ({ invalidInputs, invalidOutputs, missingInputs }) => {
  return {
    inputs: {
      ...invalidInputs,
      ..._.fromPairs(_.map(name => [name, 'This attribute is required'], missingInputs))
    },
    outputs: invalidOutputs
  }
}

const styles = {
  messageContainer: {
    height: '2.25rem',
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    bottom: '0.5rem',
    right: sideMargin
  },
  tabContents: {
    padding: `1rem ${sideMargin}`,
    backgroundColor: colors.dark(0.1)
  },
  cell: optional => ({
    fontWeight: !optional && 500,
    fontStyle: optional && 'italic'
  }),
  description: {
    display: 'flex',
    marginBottom: '0.5rem',
    marginTop: '0.5rem'
  },
  angle: {
    marginRight: '0.5rem',
    color: colors.accent()
  },
  outputInfoLabel: {
    color: colors.dark()
  },
  placeholder: {
    fontStyle: 'italic'
  }
}

const ioTask = ({ name }) => _.nth(-2, name.split('.'))
const ioVariable = ({ name }) => _.nth(-1, name.split('.'))
const ioType = ({ inputType, outputType }) => (inputType || outputType).match(/(.*?)\??$/)[1] // unify, and strip off trailing '?'

// Trim a config down based on what the `/inputsOutputs` endpoint says
const filterConfigIO = ({ inputs, outputs }) => {
  return _.flow(
    _.update('inputs', _.pick(_.map('name', inputs))),
    _.update('outputs', _.pick(_.map('name', outputs)))
  )
}

const WorkflowIOTable = ({ which, inputsOutputs: data, config, errors, onChange, onSetDefaults, onBrowse, suggestions, readOnly }) => {
  const [sort, setSort] = useState({ field: 'taskVariable', direction: 'asc' })

  const taskSort = o => ioTask(o).toLowerCase()
  const varSort = o => ioVariable(o).toLowerCase()
  const sortedData = _.orderBy(
    sort.field === 'taskVariable' ? ['optional', taskSort, varSort] : ['optional', varSort, taskSort],
    ['asc', sort.direction, sort.direction],
    data
  )

  return h(SimpleFlexTable, {
    rowCount: sortedData.length,
    noContentMessage: `No matching ${which}.`,
    columns: [
      {
        size: { basis: 350, grow: 0 },
        headerRenderer: () => h(Sortable, { sort, field: 'taskVariable', onSort: setSort }, [h(HeaderCell, ['Task name'])]),
        cellRenderer: ({ rowIndex }) => {
          const io = sortedData[rowIndex]
          return h(TextCell, { style: { fontWeight: 500 } }, [
            ioTask(io)
          ])
        }
      },
      {
        size: { basis: 360, grow: 0 },
        headerRenderer: () => h(Sortable, { sort, field: 'workflowVariable', onSort: setSort }, ['Variable']),
        cellRenderer: ({ rowIndex }) => {
          const io = sortedData[rowIndex]
          return h(TextCell, { style: styles.cell(io.optional) }, [ioVariable(io)])
        }
      },
      {
        size: { basis: 160, grow: 0 },
        headerRenderer: () => h(HeaderCell, ['Type']),
        cellRenderer: ({ rowIndex }) => {
          const io = sortedData[rowIndex]
          return h(TextCell, { style: styles.cell(io.optional) }, [ioType(io)])
        }
      },
      {
        headerRenderer: () => h(Fragment, [
          div({ style: { fontWeight: 'bold' } }, ['Attribute']),
          !readOnly && which === 'outputs' && h(Fragment, [
            div({ style: { whiteSpace: 'pre' } }, ['  |  ']),
            h(Link, { onClick: onSetDefaults }, ['Use defaults'])
          ])
        ]),
        cellRenderer: ({ rowIndex }) => {
          const { name, optional, inputType } = sortedData[rowIndex]
          const value = config[which][name] || ''
          const error = errors[which][name]
          const isFile = (inputType === 'File') || (inputType === 'File?')
          const formattedValue = JSON.stringify(Utils.maybeParseJSON(value), null, 2)
          return div({ style: { display: 'flex', alignItems: 'center', width: '100%', paddingTop: '0.5rem', paddingBottom: '0.5rem' } }, [
            div({ style: { flex: 1, display: 'flex', position: 'relative', minWidth: 0 } }, [
              !readOnly ? h(DelayedAutocompleteTextArea, {
                autosize: true,
                'aria-label': name,
                spellCheck: false,
                placeholder: optional ? 'Optional' : 'Required',
                value,
                style: isFile ? { paddingRight: '2rem' } : undefined,
                onChange: v => onChange(name, v),
                suggestions
              }) : h(TextCell, { style: { flex: 1 } }, [value]),
              !readOnly && isFile && h(Clickable, {
                style: { position: 'absolute', right: '0.5rem', top: 0, bottom: 0, display: 'flex', alignItems: 'center' },
                onClick: () => onBrowse(name),
                tooltip: 'Browse bucket files'
              }, [icon('folder-open', { size: 20 })])
            ]),
            !readOnly && h(Link, {
              style: { marginLeft: '0.25rem' },
              disabled: formattedValue === undefined || formattedValue === value,
              onClick: () => onChange(name, formattedValue),
              tooltip: Utils.cond(
                [formattedValue === undefined, () => 'Cannot format this value'],
                [formattedValue === value, () => 'Already formatted'],
                () => 'Reformat'
              )
            }, ['{…}']),
            error && h(TooltipTrigger, { content: error }, [
              icon('error-standard', {
                size: 14, style: { marginLeft: '0.5rem', color: colors.warning(), cursor: 'help' }
              })
            ])
          ])
        }
      }
    ]
  })
}

const BucketContentModal = ({ workspace: { workspace: { namespace, bucketName } }, onSelect, onDismiss }) => {
  const [prefix, setPrefix] = useState('')
  const [prefixes, setPrefixes] = useState()
  const [objects, setObjects] = useState(undefined)
  const [loading, setLoading] = useState(false)

  const signal = Utils.useCancellation()

  const load = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error loading bucket data')
  )(async (newPrefix = prefix) => {
    const { items, prefixes: newPrefixes } = await Ajax(signal).Buckets.list(namespace, bucketName, newPrefix)
    setObjects(items)
    setPrefixes(newPrefixes)
    setPrefix(newPrefix)
  })

  Utils.useOnMount(() => { load() })

  useEffect(() => {
    StateHistory.update({ objects, prefix })
  }, [objects, prefix])

  const prefixParts = _.dropRight(1, prefix.split('/'))
  return h(Modal, {
    onDismiss,
    title: 'Choose input file',
    showX: true,
    showButtons: false
  }, [
    div([
      _.map(({ label, target }) => {
        return h(Fragment, { key: target }, [
          h(Link, { onClick: () => load(target) }, [label]),
          ' / '
        ])
      }, [
        { label: 'Files', target: '' },
        ..._.map(n => {
          return { label: prefixParts[n], target: _.map(s => `${s}/`, _.take(n + 1, prefixParts)).join('') }
        }, _.range(0, prefixParts.length))
      ])
    ]),
    div({ style: { margin: '1rem -1rem 1rem -1rem', borderBottom: `1px solid ${colors.light(0.4)}` } }),
    h(SimpleTable, {
      columns: [
        { header: h(HeaderCell, ['Name']), size: { grow: 1 }, key: 'name' }
      ],
      rows: [
        ..._.map(p => {
          return {
            name: h(TextCell, [
              h(Link, { onClick: () => load(p) }, [p.slice(prefix.length)])
            ])
          }
        }, prefixes),
        ..._.map(({ name }) => {
          return {
            name: h(TextCell, [
              h(Link, { onClick: () => onSelect(`"gs://${bucketName}/${name}"`) }, [
                name.slice(prefix.length)
              ])
            ])
          }
        }, objects)
      ]
    }),
    (loading) && spinnerOverlay
  ])
}

const DocumentationCollapse = ({ children }) => {
  const [isOpened, setIsOpened] = useState(false)

  return div([
    div({
      style: styles.description,
      onClick: () => setIsOpened(!isOpened)
    }, [
      icon(isOpened ? 'angle-down' : 'angle-right', { style: styles.angle, size: 21 }),
      isOpened ?
        h(MarkdownViewer, [children]) :
        div({ style: { width: '100%', ...Style.noWrapEllipsis } }, [children])
    ])
  ])
}

const isSet = _.endsWith('_set')

const findPossibleSets = listOfExistingEntities => {
  return _.reduce((acc, entityType) => {
    return isSet(entityType) || _.includes(`${entityType}_set`, listOfExistingEntities) ?
      acc :
      Utils.append(`${entityType}_set`, acc)
  }, [], listOfExistingEntities)
}

const WorkflowView = _.flow(
  Utils.forwardRefWithName('WorkflowView'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceTab(props, 'workflows'),
    title: _.get('workflowName'), activeTab: 'workflows'
  })
)(({ namespace, name: workspaceName, workspace: outerWs, workspace: { accessLevel, workspace: innerWs, workspace: { bucketName, attributes } }, queryParams: { selectionKey }, workflowNamespace, workflowName }, ref) => {
  // State
  const [activeTab, setActiveTab] = useState('inputs')
  const [entitySelectionModel, setEntitySelectionModel] = useState({ selectedEntities: {} })
  const [useCallCache, setUseCallCache] = useState(true)
  const [deleteIntermediateOutputFiles, setDeleteIntermediateOutputFiles] = useState(false)
  const [useReferenceDisks, setUseReferenceDisks] = useState(false)
  const [includeOptionalInputs, setIncludeOptionalInputs] = useState(true)
  const [filter, setFilter] = useState('')
  const [errors, setErrors] = useState({ inputs: {}, outputs: {} })
  const [modifiedConfig, setModifiedConfig] = useState(undefined) // active data, potentially unsaved
  const [processSingle, setProcessSingle] = useState(undefined)
  const [selectedEntityType, setSelectedEntityType] = useState(undefined)
  const [isFreshData, setIsFreshData] = useState(false) // controls spinnerOverlay on initial load
  const [savedConfig, setSavedConfig] = useState(undefined) // unmodified copy of config for checking for unsaved edits
  const [entityMetadata, setEntityMetadata] = useState(undefined)
  const [launching, setLaunching] = useState(false)
  const [selectedVariable, setSelectedVariable] = useState(undefined) // field of focus for bucket file browser
  const [updatingConfig, setUpdatingConfig] = useState(false)
  const [selectedSnapshotEntityMetadata, setSelectedSnapshotEntityMetadata] = useState(undefined)
  const [currentSnapRedacted, setCurrentSnapRedacted] = useState(undefined)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [copying, setCopying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectingData, setSelectingData] = useState(false)
  const [synopsis, setSynopsis] = useState(undefined)
  const [documentation, setDocumentation] = useState(undefined)
  const [availableSnapshots, setAvailableSnapshots] = useState(undefined)
  const [versionIds, setVersionIds] = useState([])
  const [savedSnapRedacted, setSavedSnapRedacted] = useState(undefined)
  const [wdl, setWdl] = useState(undefined)
  const [modifiedInputsOutputs, setModifiedInputsOutputs] = useState(undefined)
  const [workspaceAttributes, setWorkspaceAttributes] = useState(undefined)
  const [savedInputsOutputs, setSavedInputsOutputs] = useState(undefined)

  const signal = Utils.useCancellation()


  // Everything else, for now
  const { newSetName, selectedEntities, type } = entitySelectionModel

  const resetSelectionModel = (value, selectedEntities = {}, newEntityMetadata = entityMetadata, isSnapshot) => {
    // If the default for non-set types changes from `processAllAsSet` then the calculation of `noLaunchReason` in `renderSummary` needs to be updated accordingly.
    // Currently, `renderSummary` assumes that it is not possible to have nothing selected for non-set types.
    return {
      type: Utils.cond(
        [isSnapshot, () => processSnapshotTable],
        [isSet(value), () => _.includes(value, _.keys(newEntityMetadata)) ? chooseSets : processAllAsSet],
        [_.isEmpty(selectedEntities), () => processAll],
        () => chooseRows
      ),
      selectedEntities,
      newSetName: Utils.sanitizeEntityName(`${workflowName}_${new Date().toISOString().slice(0, -5)}`)
    }
  }

  const selectSingle = () => {
    setProcessSingle(true)
    setModifiedConfig(_.omit('rootEntityType'))
  }

  const selectMultiple = () => {
    setProcessSingle(false)
    setModifiedConfig(_.set(['rootEntityType'], selectedEntityType))
  }

  const updateSingleOrMultipleRadioState = ({ rootEntityType, dataReferenceName }) => {
    setProcessSingle(!rootEntityType)
    setSelectedEntityType(dataReferenceName || rootEntityType)
  }

  const render = () => {
    const workspaceId = { namespace, name: workspaceName }

    return h(Fragment, [
      savedConfig && h(Fragment, [
        renderSummary(),
        Utils.switchCase(activeTab,
          ['wdl', renderWDL],
          ['inputs', () => renderIOTable('inputs')],
          ['outputs', () => renderIOTable('outputs')]
        ),
        launching && h(LaunchAnalysisModal, {
          workspace: outerWs, config: savedConfig, entityMetadata: selectedSnapshotEntityMetadata || entityMetadata,
          accessLevel, bucketName,
          processSingle, entitySelectionModel, useCallCache, deleteIntermediateOutputFiles, useReferenceDisks,
          onDismiss: () => setLaunching(false),
          onSuccess: submissionId => {
            const { methodRepoMethod: { methodVersion, methodNamespace, methodName, methodPath, sourceRepo } } = modifiedConfig
            // will only match if the current root entity type comes from a snapshot
            const snapshot = _.find({ name: modifiedConfig.dataReferenceName }, availableSnapshots)
            Ajax().Metrics.captureEvent(Events.workflowLaunch, {
              ...extractWorkspaceDetails(innerWs),
              snapshotId: snapshot?.reference.snapshot,
              referenceId: snapshot?.referenceId,
              methodVersion,
              sourceRepo,
              methodPath: sourceRepo === 'agora' ? `${methodNamespace}/${methodName}` : methodPath
            })
            Nav.goToPath('workspace-submission-details', { submissionId, ...workspaceId })
          }
        }),
        !!selectedVariable && h(BucketContentModal, {
          workspace: outerWs,
          onDismiss: () => setSelectedVariable(undefined),
          onSelect: v => {
            setSelectedVariable(undefined)
            setModifiedConfig(_.set(['inputs', selectedVariable], v))
          }
        })
      ]),
      (!isFreshData || updatingConfig) && spinnerOverlay
    ])
  }

  const getValidation = async () => {
    try {
      return await Ajax(signal).Workspaces.workspace(namespace, workspaceName).methodConfig(workflowNamespace, workflowName).validate()
    } catch (e) {
      if (e.status === 404) {
        return false
      } else {
        throw e
      }
    }
  }

  Utils.useOnMount(() => {
    const load = async () => {
      try {
        const ws = Ajax(signal).Workspaces.workspace(namespace, workspaceName)

        const [entityMetadata, validationResponse, config] = await Promise.all([
          ws.entityMetadata(),
          getValidation(),
          ws.methodConfig(workflowNamespace, workflowName).get()
        ])
        const { methodRepoMethod: { methodNamespace, methodName, sourceRepo, methodPath } } = config
        const isRedacted = !validationResponse

        const inputsOutputs = isRedacted ? {} : await Ajax(signal).Methods.configInputsOutputs(config)
        const selection = workflowSelectionStore.get()
        const readSelection = selectionKey && selection.key === selectionKey

        const { resources: snapshots } = await Ajax(signal).Workspaces.workspace(namespace, workspaceName).listSnapshot(1000, 0)

        // Dockstore users who target floating tags can change their WDL via Github without explicitly selecting a new version in Terra.
        // Before letting the user edit the config we retrieved from the DB, drop any keys that are no longer valid. [WA-291]
        // N.B. this causes `config` and `modifiedConfig` to be unequal, so we (accurately) prompt the user to save before launching
        // DO NOT filter when a config is redacted, when there's no IO from the WDL we would erase the user's inputs
        const modifiedConfig = _.flow(
          readSelection ? _.set('rootEntityType', selection.entityType) : _.identity,
          !isRedacted ? filterConfigIO(inputsOutputs) : _.identity
        )(config)

        const selectedSnapshotEntityMetadata = modifiedConfig.dataReferenceName ? await Ajax(signal).Workspaces.workspace(namespace, workspaceName).snapshotEntityMetadata(namespace, modifiedConfig.dataReferenceName) : undefined

        ReactDOM.unstable_batchedUpdates(() => { // Force batched updates, since these are all used together
          setSavedConfig(config)
          setModifiedConfig(modifiedConfig)
          setCurrentSnapRedacted(isRedacted)
          setSavedSnapRedacted(isRedacted)
          setEntityMetadata(entityMetadata)
          setAvailableSnapshots(_.sortBy(_.lowerCase, snapshots))
          setSelectedSnapshotEntityMetadata(selectedSnapshotEntityMetadata)
          setSavedInputsOutputs(inputsOutputs)
          setModifiedInputsOutputs(inputsOutputs)
          setErrors(isRedacted ? { inputs: {}, outputs: {} } : augmentErrors(validationResponse))
          setEntitySelectionModel(resetSelectionModel(
            modifiedConfig.dataReferenceName || modifiedConfig.rootEntityType,
            readSelection ? selection.entities : {},
            entityMetadata, !!modifiedConfig.dataReferenceName
          ))
          setWorkspaceAttributes(_.flow(
            _.without(['description']),
            _.remove(s => s.includes(':'))
          )(_.keys(attributes)))
        })

        if (sourceRepo === 'agora') {
          const methods = await Ajax(signal).Methods.list({ namespace: methodNamespace, name: methodName })
          const snapshotIds = _.map('snapshotId', methods)

          setVersionIds(snapshotIds)
        } else if (sourceRepo === 'dockstore' || sourceRepo === 'dockstoretools') {
          const versions = await Ajax(signal).Dockstore.getVersions({ path: methodPath, isTool: sourceRepo === 'dockstoretools' })
          const versionIds = _.map('name', versions)

          setVersionIds(versionIds)
        } else {
          throw new Error('unknown sourceRepo')
        }

        updateSingleOrMultipleRadioState(modifiedConfig)
        fetchInfo(config, isRedacted)
      } catch (error) {
        reportError('Error loading data', error)
      } finally {
        setIsFreshData(true)
      }
    }

    load()
  })

  useEffect(() => {
    StateHistory.update({
      savedConfig, modifiedConfig, entityMetadata, savedInputsOutputs, modifiedInputsOutputs, activeTab, wdl,
      currentSnapRedacted, savedSnapRedacted
    })
  }, [savedConfig, modifiedConfig, entityMetadata, savedInputsOutputs, modifiedInputsOutputs, activeTab, wdl,
    currentSnapRedacted, savedSnapRedacted])

  const fetchInfo = withErrorReporting('Error loading WDL', async (savedConfig, currentSnapRedacted) => {
    const { methodRepoMethod: { sourceRepo, methodNamespace, methodName, methodVersion, methodPath } } = savedConfig
    if (sourceRepo === 'agora') {
      if (!currentSnapRedacted) {
        const { synopsis, documentation, payload } = await Ajax(signal).Methods.method(methodNamespace, methodName, methodVersion).get()
        setSynopsis(synopsis)
        setDocumentation(documentation)
        setWdl(payload)
      }
    } else if (sourceRepo === 'dockstore' || sourceRepo === 'dockstoretools') {
      const wdl = await Ajax(signal).Dockstore.getWdl({ path: methodPath, version: methodVersion, isTool: sourceRepo === 'dockstoretools' })
      setWdl(wdl)
    } else {
      throw new Error('unknown sourceRepo')
    }
  })

  const describeSelectionModel = () => {
    const { rootEntityType } = modifiedConfig
    const count = _.size(selectedEntities)
    const newSetMessage = (type === processAll || type === processAllAsSet ||
      (type === chooseSetComponents && count > 0) || count > 1) ? `(will create a new set named "${newSetName}")` : ''
    const baseEntityType = isSet(rootEntityType) ? rootEntityType.slice(0, -4) : rootEntityType
    return Utils.cond(
      [processSingle || !rootEntityType, () => ''],
      [type === processAll, () => `all ${entityMetadata[rootEntityType]?.count || 0} ${rootEntityType}s ${newSetMessage}`],
      [type === processMergedSet, () => `${rootEntityType}s from ${count} sets ${newSetMessage}`],
      [type === chooseRows, () => `${count} selected ${rootEntityType}s ${newSetMessage}`],
      [type === chooseSetComponents, () => `1 ${rootEntityType} containing ${count} ${baseEntityType}s ${newSetMessage}`],
      [type === processAllAsSet,
        () => `1 ${rootEntityType} containing all ${entityMetadata[baseEntityType]?.count || 0} ${baseEntityType}s ${newSetMessage}`],
      [type === chooseSets, () => !!count ?
        `${count} selected ${rootEntityType}s ${newSetMessage}` :
        `No ${rootEntityType}s selected`],
      [type === processSnapshotTable, () => `process entire snapshot table`]
    )
  }

  const canSave = () => {
    return processSingle || !!modifiedConfig.rootEntityType
  }

  const loadNewMethodConfig = _.flow(
    withErrorReporting('Error updating config'),
    Utils.withBusyState(setUpdatingConfig)
  )(async newSnapshotId => {
    const { methodRepoMethod: { methodNamespace, methodName, methodPath, sourceRepo } } = modifiedConfig
    const config = await Ajax(signal).Methods.template({ methodNamespace, methodName, methodPath, sourceRepo, methodVersion: newSnapshotId })
    const modifiedInputsOutputs = await Ajax(signal).Methods.configInputsOutputs(config)
    setModifiedInputsOutputs(modifiedInputsOutputs)
    setSavedSnapRedacted(currentSnapRedacted)
    setCurrentSnapRedacted(false)
    setModifiedConfig(_.update('modifiedConfig', _.flow(
      _.set('methodRepoMethod', config.methodRepoMethod),
      filterConfigIO(modifiedInputsOutputs)
    )))
    fetchInfo(config)
  })


  const renderSummary = () => {
    const { name, methodRepoMethod: { methodPath, methodVersion, methodNamespace, methodName, sourceRepo }, rootEntityType } = modifiedConfig
    const entityTypes = _.keys(entityMetadata)
    const possibleSetTypes = findPossibleSets(entityTypes)
    const modified = !_.isEqual(modifiedConfig, savedConfig)
    const noLaunchReason = Utils.cond(
      [saving || modified, () => 'Save or cancel to Launch Analysis'],
      [entitySelectionModel.type === processSnapshotTable && (!rootEntityType || !(modifiedConfig.dataReferenceName)),
        () => 'A snapshot and table must be selected'],
      [!_.isEmpty(errors.inputs) || !_.isEmpty(errors.outputs), () => 'At least one required attribute is missing or invalid'],
      [entitySelectionModel.type !== processSnapshotTable && !processSingle &&
      (!entityMetadata[rootEntityType] && !_.includes(rootEntityType, possibleSetTypes)),
      () => `There are no ${selectedEntityType}s in this workspace.`],
      // Default for _set types is `chooseSets` so we need to make sure something is selected.
      // Default for non- _set types is `processAll` and the "Select Data" modal makes it impossible to have nothing selected for these types.
      // Users have expressed dislike of the `processAll` default so this clause will likely need to be expanded along with any change to `resetSelectionModel`.
      [!processSingle && (entitySelectionModel.type === chooseSets || entitySelectionModel.type === chooseSetComponents) && !_.size(entitySelectionModel.selectedEntities),
        () => 'Select or create a set']
    )

    const inputsValid = _.isEmpty(errors.inputs)
    const outputsValid = _.isEmpty(errors.outputs)
    const sourceDisplay = sourceRepo === 'agora' ? `${methodNamespace}/${methodName}/${methodVersion}` : `${methodPath}:${methodVersion}`
    return div({
      style: {
        position: 'relative',
        backgroundColor: 'white', borderBottom: `2px solid ${terraSpecial()}`,
        boxShadow: '0 2px 5px 0 rgba(0,0,0,0.26), 0 2px 10px 0 rgba(0,0,0,0.16)'
      }
    }, [
      div({ style: { display: 'flex', padding: `0.5rem ${sideMargin} 0`, minHeight: 120 } }, [
        div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0 } }, [
          h(Link, {
            href: Nav.getLink('workspace-workflows', { namespace, name: workspaceName }),
            style: { display: 'inline-flex', alignItems: 'center', padding: '0.5rem 0' }
          }, [icon('arrowLeft', { style: { marginRight: '0.5rem' } }), 'Back to list']),
          div({ style: { display: 'flex' } }, [
            span({ style: { marginLeft: '-2rem', width: '2rem' } }, [
              h(PopupTrigger, {
                closeOnClick: true,
                content: h(Fragment, [
                  h(MenuButton, {
                    onClick: () => setExporting(true)
                  }, [makeMenuIcon('export'), 'Copy to Another Workspace']),
                  h(MenuButton, {
                    onClick: () => setCopying(true)
                  }, [makeMenuIcon('copy'), 'Duplicate']),
                  h(MenuButton, {
                    disabled: !!Utils.editWorkspaceError(outerWs),
                    tooltip: Utils.editWorkspaceError(outerWs),
                    tooltipSide: 'right',
                    onClick: () => setDeleting(true)
                  }, [makeMenuIcon('trash'), 'Delete'])
                ])
              }, [
                h(Link, { 'aria-label': 'Workflow menu' }, [icon('cardMenuIcon', { size: 22 })])
              ])
            ]),
            span({ style: { color: colors.dark(), fontSize: 24 } }, name)
          ]),
          currentSnapRedacted && div({ style: { color: colors.warning(), fontSize: 16, fontWeight: 500, marginTop: '0.5rem' } }, [
            'You do not have access to this workflow, or this snapshot has been removed. To use this workflow, contact the owner to request access, or select another snapshot.'
          ]),
          h(IdContainer, [id => div({ style: { marginTop: '0.5rem' } }, [
            label({ htmlFor: id }, [`${sourceRepo === 'agora' ? 'Snapshot' : 'Version'}: `]),
            div({ style: { display: 'inline-block', marginLeft: '0.25rem', width: sourceRepo === 'agora' ? 75 : 200 } }, [
              h(Select, {
                id,
                isDisabled: !!Utils.editWorkspaceError(outerWs),
                isClearable: false,
                isSearchable: false,
                value: methodVersion,
                options: _.sortBy(sourceRepo === 'agora' ? _.toNumber : _.identity,
                  _.uniq([...versionIds, savedConfig.methodRepoMethod.methodVersion])),
                isOptionDisabled: ({ value }) => (currentSnapRedacted || savedSnapRedacted) &&
                  (value === savedConfig.methodRepoMethod.methodVersion),
                onChange: chosenSnapshot => loadNewMethodConfig(chosenSnapshot.value)
              })
            ])
          ])]),
          div([
            'Source: ', currentSnapRedacted ? sourceDisplay : h(Link, {
              href: methodLink(modifiedConfig),
              ...Utils.newTabLinkProps
            }, [sourceDisplay])
          ]),
          div(`Synopsis: ${synopsis ? synopsis : ''}`),
          !!documentation ?
            h(DocumentationCollapse, [documentation]) :
            div({ style: { fontStyle: 'italic', ...styles.description } }, ['No documentation provided']),
          div({ role: 'radiogroup', 'aria-label': 'Select number of target entities', style: { marginBottom: '1rem' } }, [
            div([
              h(RadioButton, {
                disabled: !!Utils.editWorkspaceError(outerWs) || currentSnapRedacted,
                text: 'Run workflow with inputs defined by file paths',
                name: 'process-workflows',
                checked: processSingle,
                onChange: () => selectSingle(),
                labelStyle: { marginLeft: '0.5rem' }
              })
            ]),
            div([
              h(RadioButton, {
                disabled: !!Utils.editWorkspaceError(outerWs) || currentSnapRedacted,
                text: 'Run workflow(s) with inputs defined by data table',
                name: 'process-workflows',
                checked: !processSingle,
                onChange: () => selectMultiple(),
                labelStyle: { marginLeft: '0.5rem' }
              })
            ]),
            !processSingle && div({ style: { display: 'flex', margin: '0.5rem 0 0 2rem' } }, [
              div([
                div({ style: { height: '2rem', fontWeight: 'bold' } }, ['Step 1']),
                label(['Select root entity type:']),
                h(GroupedSelect, {
                  'aria-label': 'Entity type selector',
                  isClearable: false,
                  isDisabled: currentSnapRedacted || processSingle || !!Utils.editWorkspaceError(outerWs),
                  isSearchable: true,
                  placeholder: 'Select data type...',
                  styles: { container: old => ({ ...old, display: 'inline-block', width: 200, marginLeft: '0.5rem' }) },
                  value: selectedEntityType,
                  onChange: async ({ value, source }) => {
                    if (source === 'snapshot') {
                      const selectedSnapshotEntityMetadata = await Ajax(signal)
                        .Workspaces
                        .workspace(namespace, workspaceName)
                        .snapshotEntityMetadata(namespace, value)

                      setModifiedConfig({ ...modifiedConfig, dataReferenceName: value, rootEntityType: undefined })

                      setSelectedSnapshotEntityMetadata(selectedSnapshotEntityMetadata)
                      setSelectedEntityType(value)
                      setEntitySelectionModel(resetSelectionModel(value, undefined, undefined, true))
                    } else {
                      setModifiedConfig({ ...modifiedConfig, dataReferenceName: undefined, rootEntityType: value })
                      setSelectedEntityType(value)
                      setEntitySelectionModel(resetSelectionModel(value, {}, entityMetadata, false))
                      setSelectedSnapshotEntityMetadata(undefined)
                    }
                  },
                  options: [
                    {
                      label: 'TABLES',
                      options: _.map(entityType => ({ value: entityType, source: 'table' }),
                        _.sortBy(_.lowerCase, [...entityTypes, ...possibleSetTypes]))
                    },
                    {
                      label: 'SNAPSHOTS',
                      options: _.map(({ name }) => ({ value: name, source: 'snapshot' }), availableSnapshots)
                    }
                  ]
                })
              ]),
              entitySelectionModel.type === processSnapshotTable ? div({ style: { margin: '2rem 0 0 2rem' } }, [
                h(Select, {
                  isDisabled: !!Utils.editWorkspaceError(outerWs),
                  'aria-label': 'Snapshot table selector',
                  isClearable: false,
                  value: modifiedConfig.dataReferenceName ? modifiedConfig.rootEntityType : undefined,
                  onChange: ({ value }) => {
                    setModifiedConfig({ ...modifiedConfig, rootEntityType: value, entityName: undefined })
                  },
                  styles: { container: old => ({ ...old, display: 'inline-block', width: 200, marginLeft: '0.5rem' }) },
                  options: _.sortBy(_.identity, _.keys(selectedSnapshotEntityMetadata))
                })
              ]) :
                div({ style: { marginLeft: '2rem', paddingLeft: '2rem', borderLeft: `2px solid ${colors.dark(0.2)}`, flex: 1 } }, [
                  div({ style: { height: '2rem', fontWeight: 'bold' } }, ['Step 2']),
                  div({ style: { display: 'flex', alignItems: 'center' } }, [
                    h(ButtonPrimary, {
                      disabled: currentSnapRedacted || processSingle || !rootEntityType ||
                        !_.includes(selectedEntityType, [...entityTypes, ...possibleSetTypes]) || !!Utils.editWorkspaceError(outerWs),
                      tooltip: Utils.editWorkspaceError(outerWs),
                      onClick: () => setSelectingData(true)
                    }, ['Select Data']),
                    label({ style: { marginLeft: '1rem' } }, [`${describeSelectionModel()}`])
                  ])
                ])
            ])
          ]),
          div({ style: { marginTop: '1rem' } }, [
            h(LabeledCheckbox, {
              disabled: currentSnapRedacted || !!Utils.computeWorkspaceError(outerWs),
              checked: useCallCache,
              onChange: setUseCallCache
            }, [' Use call caching']),
            span({ style: { margin: '0 0.5rem 0 1rem' } }, [
              h(LabeledCheckbox, {
                checked: deleteIntermediateOutputFiles,
                onChange: setDeleteIntermediateOutputFiles,
                style: { marginLeft: '1rem' }
              }, [' Delete intermediate outputs'])
            ]),
            h(InfoBox, [
              'If the workflow succeeds, only the final output will be saved. Subsequently, call caching cannot be used as the intermediate steps will be not available. ',
              h(Link, {
                href: 'https://support.terra.bio/hc/en-us/articles/360039681632',
                ...Utils.newTabLinkProps
              }, ['Click here to learn more.'])
            ]),
            span({ style: { margin: '0 0.5rem 0 1rem' } }, [
              h(LabeledCheckbox, {
                checked: useReferenceDisks,
                onChange: setUseReferenceDisks,
                style: { marginLeft: '1rem' }
              }, [' Use reference disks'])
            ]),
            h(InfoBox, [
              'Use a reference disk image if available rather than localizing reference inputs. ',
              h(Link, {
                href: 'https://support.terra.bio/hc/en-us/articles/360056384631',
                ...Utils.newTabLinkProps
              }, ['Click here to learn more.'])
            ])
          ]),
          h(StepButtons, {
            tabs: [
              ...(!currentSnapRedacted ? [{ key: 'wdl', title: 'Script', isValid: true }] : []),
              { key: 'inputs', title: 'Inputs', isValid: inputsValid },
              { key: 'outputs', title: 'Outputs', isValid: outputsValid }
            ],
            activeTab,
            onChangeTab: v => {
              setActiveTab(v)
              setFilter('')
            },
            finalStep: h(ButtonPrimary, {
              style: { marginLeft: '1rem' },
              disabled: !!Utils.computeWorkspaceError(outerWs) || !!noLaunchReason || currentSnapRedacted,
              tooltip: Utils.computeWorkspaceError(outerWs) || noLaunchReason || (currentSnapRedacted && 'Workflow version was redacted.'),
              onClick: () => setLaunching(true)
            }, ['Run analysis'])
          }),
          activeTab === 'outputs' && !currentSnapRedacted && div({ style: { marginBottom: '1rem' } }, [
            div({ style: styles.outputInfoLabel }, 'Output files will be saved to'),
            div({ style: { display: 'flex', alignItems: 'center' } }, [
              div({ style: { flex: 'none', display: 'flex', width: '1.5rem' } }, [icon('folder', { size: 18 })]),
              div({ style: { flex: 1 } }, [
                'Files / ',
                span({ style: styles.placeholder }, 'submission unique ID'),
                ' / ', wdl ? wdl.match(/^\s*workflow ([^\s{]+)\s*{/m)[1] : span({ style: styles.placeholder }, 'workflow name'), ' / ',
                span({ style: styles.placeholder }, 'workflow unique ID')
              ])
            ]),
            !!rootEntityType && (entitySelectionModel.type !== processSnapshotTable) && h(Fragment, [
              div({ style: { margin: '0.5rem 0', borderBottom: `1px solid ${colors.dark(0.55)}` } }),
              div({ style: styles.outputInfoLabel }, 'References to outputs will be written to'),
              div({ style: { display: 'flex', alignItems: 'center' } }, [
                div({ style: { flex: 'none', display: 'flex', width: '1.5rem' } }, [icon('listAlt')]),
                `Tables / ${rootEntityType}`
              ]),
              `Fill in the attributes below to add or update columns in your data table`
            ])
          ])
        ])
      ]),
      div({ style: styles.messageContainer }, [
        saving && miniMessage('Saving...'),
        saved && !saving && !modified && miniMessage('Saved!'),
        modified && h(ButtonPrimary, { disabled: saving || !canSave(), onClick: () => save() }, 'Save'),
        modified && h(ButtonSecondary, { style: { marginLeft: '1rem' }, disabled: saving, onClick: () => cancel() }, 'Cancel')
      ]),
      exporting && h(ExportWorkflowModal, {
        thisWorkspace: innerWs, methodConfig: savedConfig,
        onDismiss: () => setExporting(false)
      }),
      copying && h(ExportWorkflowModal, {
        thisWorkspace: innerWs, methodConfig: savedConfig,
        sameWorkspace: true,
        onDismiss: () => setCopying(false),
        onSuccess: () => Nav.goToPath('workspace-workflows', { namespace, name: workspaceName })
      }),
      deleting && h(DeleteWorkflowModal, {
        workspace: innerWs, methodConfig: savedConfig,
        onDismiss: () => setDeleting(false),
        onSuccess: () => Nav.goToPath('workspace-workflows', { namespace, name: workspaceName })
      }),
      selectingData && h(DataStepContent, {
        entityMetadata,
        entitySelectionModel,
        onDismiss: () => setSelectingData(false),
        onSuccess: model => {
          setEntitySelectionModel(model)
          setSelectingData(false)
        },
        workspace: innerWs,
        rootEntityType: modifiedConfig.rootEntityType,
        workspaceId: { namespace, name: workspaceName }
      })
    ])
  }

  const downloadJson = key => {
    const prepIO = _.mapValues(v => /^".*"/.test(v) ? v.slice(1, -1) : `\${${v}}`)

    const blob = new Blob([JSON.stringify(prepIO(modifiedConfig[key]))], { type: 'application/json' })
    FileSaver.saveAs(blob, `${key}.json`)
  }

  const uploadJson = async (key, file) => {
    try {
      const rawUpdates = JSON.parse(await Utils.readFileAsText(file))
      const updates = _.mapValues(v => _.isString(v) && v.match(/\${(.*)}/) ?
        v.replace(/\${(.*)}/, (_, match) => match) :
        JSON.stringify(v)
      )(rawUpdates)
      setModifiedConfig(modifiedConfig => {
        const existing = _.map('name', modifiedInputsOutputs[key])
        return {
          modifiedConfig: _.update(key, _.assign(_, _.pick(existing, updates)), modifiedConfig)
        }
      })
    } catch (error) {
      if (error instanceof SyntaxError) {
        reportError('Error processing file', 'This json file is not formatted correctly.')
      } else {
        reportError('Error processing file', error)
      }
    }
  }

  const renderWDL = () => {
    return div({ style: styles.tabContents }, [
      wdl ? h(WDLViewer, {
        wdl, readOnly: true,
        style: { maxHeight: 500 }
      }) : centeredSpinner()
    ])
  }

  const renderIOTable = key => {
    // Sometimes we're getting totally empty metadata. Not sure if that's valid; if not, revert this

    const selectedTableName = modifiedConfig.dataReferenceName ? modifiedConfig.rootEntityType : undefined
    const selectionMetadata = selectedTableName ? selectedSnapshotEntityMetadata : entityMetadata
    const attributeNames = _.get([modifiedConfig.rootEntityType, 'attributeNames'], selectionMetadata) || []
    const suggestions = [
      ...(!selectedTableName && !modifiedConfig.dataReferenceName) ? [`this.${modifiedConfig.rootEntityType}_id`] : [],
      ...(modifiedConfig.rootEntityType ? _.map(name => `this.${name}`, attributeNames) : []),
      ..._.map(name => `workspace.${name}`, workspaceAttributes)
    ]
    const data = currentSnapRedacted ?
      _.map(k => ({ name: k, inputType: 'unknown' }), _.keys(modifiedConfig[key])) :
      modifiedInputsOutputs[key]
    const filteredData = _.filter(({ name, optional }) => {
      return !(key === 'inputs' && !includeOptionalInputs && optional) && Utils.textMatch(filter, name)
    }, data)

    const isSingleAndOutputs = key === 'outputs' && processSingle
    const isEditable = !currentSnapRedacted && !Utils.editWorkspaceError(outerWs) && !isSingleAndOutputs

    return h(Dropzone, {
      key,
      accept: '.json',
      multiple: false,
      disabled: currentSnapRedacted || !!Utils.editWorkspaceError(outerWs) || data.length === 0,
      style: {
        ...styles.tabContents,
        flex: 'auto', display: 'flex', flexDirection: 'column',
        position: undefined
      },
      activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
      onDropRejected: () => reportError('Not a valid inputs file',
        'The selected file is not a json file. To import inputs for this workflow, upload a file with a .json extension.'),
      onDropAccepted: files => uploadJson(key, files[0])
    }, [({ openUploader }) => data.length === 0 ? `No configurable ${key}.` : h(Fragment, [
      div({ style: { flex: 'none', display: 'flex', alignItems: 'center', marginBottom: '0.25rem' } }, [
        isSingleAndOutputs && !currentSnapRedacted && div({ style: { margin: '0 1rem 0.5rem' } }, [
          b(['Outputs are not mapped to the data model when processing a single workflow from files.']),
          div(['To write to the data model, select "Process multiple workflows" above.'])
        ]),
        key === 'inputs' && _.some('optional', modifiedInputsOutputs['inputs']) ?
          h(Link, { style: { marginRight: 'auto' }, onClick: () => setIncludeOptionalInputs(!includeOptionalInputs) },
            [includeOptionalInputs ? 'Hide optional inputs' : 'Show optional inputs']) :
          div({ style: { marginRight: 'auto' } }),
        h(Link, { onClick: () => downloadJson(key) }, ['Download json']),
        isEditable && h(Fragment, [
          div({ style: { whiteSpace: 'pre' } }, ['  |  Drag or click to ']),
          h(Link, { onClick: openUploader }, ['upload json'])
        ]),
        h(DelayedSearchInput, {
          'aria-label': `Search ${key}`,
          style: { marginLeft: '1rem', width: 200 },
          placeholder: `SEARCH ${key.toUpperCase()}`,
          value: filter,
          onChange: setFilter
        })
      ]),
      div({ style: { flex: '1 0 auto' } }, [
        h(WorkflowIOTable, {
          readOnly: !isEditable,
          which: key,
          inputsOutputs: filteredData,
          config: modifiedConfig,
          errors,
          onBrowse: setSelectedVariable,
          onChange: (name, v) => setModifiedConfig(_.set([key, name], v)),
          onSetDefaults: () => setModifiedConfig(_.set(
            ['outputs'],
            _.fromPairs(_.map(({ name }) => [name, `this.${_.last(name.split('.'))}`], modifiedInputsOutputs.outputs))
          )),
          suggestions
        })
      ])
    ])])
  }

  const save = _.flow(
    withErrorReporting('Error saving'),
    Utils.withBusyState(setSaving)
  )(async () => {
    const trimInputOutput = _.flow(
      _.update('inputs', _.mapValues(_.trim)),
      _.update('outputs', processSingle ? () => ({}) : _.mapValues(_.trim))
    )

    const validationResponse = await Ajax().Workspaces.workspace(namespace, workspaceName)
      .methodConfig(workflowNamespace, workflowName)
      .save(trimInputOutput(modifiedConfig))

    setSaved(true)
    setSavedConfig(validationResponse.methodConfiguration)
    setModifiedConfig(validationResponse.methodConfiguration)
    setErrors(augmentErrors(validationResponse))
    setSavedInputsOutputs(modifiedInputsOutputs)
    setSelectedEntityType(_.get([type === processSnapshotTable ? 'dataReferenceName' : 'rootEntityType'], validationResponse.methodConfiguration))

    setTimeout(() => setSaved(false), 3000)
  })

  const cancel = () => {
    setSaved(false)
    setModifiedConfig(savedConfig)
    setModifiedInputsOutputs(savedInputsOutputs)
    setEntitySelectionModel(resetSelectionModel(savedConfig.rootEntityType))
    setCurrentSnapRedacted(savedSnapRedacted)
    setActiveTab(activeTab === 'wdl' && savedSnapRedacted ? 'inputs' : activeTab)

    updateSingleOrMultipleRadioState(savedConfig)
  }

  return render()
})


export const navPaths = [
  {
    name: 'workflow',
    path: '/workspaces/:namespace/:name/workflows/:workflowNamespace/:workflowName',
    component: WorkflowView,
    title: ({ name, workflowName }) => `${name} - Workflows - ${workflowName}`
  }, {
    name: 'tools-workflow', // legacy
    path: '/workspaces/:namespace/:name/tools/:workflowNamespace/:workflowName',
    component: props => h(Nav.Redirector, { pathname: Nav.getPath('workflow', props) })
  }
]
