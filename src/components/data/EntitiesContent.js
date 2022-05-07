import * as clipboard from 'clipboard-polyfill/text'
import FileSaver from 'file-saver'
import JSZip from 'jszip'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useRef, useState } from 'react'
import { div, form, h, input } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { ButtonPrimary, ButtonSecondary, Link } from 'src/components/common'
import { AddEntityModal, EntityDeleter, ModalToolButton, MultipleEntityEditor, saveScroll } from 'src/components/data/data-utils'
import DataTable from 'src/components/data/DataTable'
import ExportDataModal from 'src/components/data/ExportDataModal'
import { icon, spinner } from 'src/components/icons'
import IGVBrowser from 'src/components/IGVBrowser'
import IGVFileSelector from 'src/components/IGVFileSelector'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { cohortNotebook, cohortRNotebook, NotebookCreator } from 'src/components/notebook-utils'
import { MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import TitleBar from 'src/components/TitleBar'
import WorkflowSelector from 'src/components/WorkflowSelector'
import datasets from 'src/data/datasets'
import dataExplorerLogo from 'src/images/data-explorer-logo.svg'
import igvLogo from 'src/images/igv-logo.png'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import wdlLogo from 'src/images/wdl-logo.png'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig, isDataTabRedesignEnabled } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const getDataset = dataExplorerUrl => {
  // Either cohort was imported from standalone Data Explorer, eg
  // https://test-data-explorer.appspot.com/
  const dataset = _.find({ origin: new URL(dataExplorerUrl).origin }, datasets)
  if (!dataset) {
    // Or cohort was imported from embedded Data Explorer, eg
    // https://app.terra.bio/#library/datasets/public/1000%20Genomes/data-explorer
    const datasetName = unescape(dataExplorerUrl.split(/datasets\/(?:public\/)?([^/]+)\/data-explorer/)[1])
    return _.find({ name: datasetName }, datasets)
  }
  return dataset
}

const toolDrawerId = 'tool-drawer-title'

const ToolDrawer = _.flow(
  withDisplayName('ToolDrawer'),
  requesterPaysWrapper({
    onDismiss: ({ onDismiss }) => onDismiss()
  }),
  withModalDrawer({ 'aria-labelledby': toolDrawerId })
)(({
  workspace, workspace: { workspace: { bucketName, name: wsName, namespace, googleProject, workspaceId } },
  onDismiss, onIgvSuccess, onRequesterPaysError, entityMetadata, entityKey, selectedEntities
}) => {
  const [toolMode, setToolMode] = useState()
  const [notebookNames, setNotebookNames] = useState()
  const signal = useCancellation()

  const { Buckets } = Ajax(signal)

  useOnMount(() => {
    const loadNotebookNames = _.flow(
      withRequesterPaysHandler(onRequesterPaysError),
      withErrorReporting('Error loading notebooks')
    )(async () => {
      const notebooks = await Buckets.listNotebooks(googleProject, bucketName)
      // slice removes 'notebooks/' and the .ipynb suffix
      setNotebookNames(notebooks.map(notebook => notebook.name.slice(10, -6)))
    })

    loadNotebookNames()
  })

  const entitiesCount = _.size(selectedEntities)
  const isCohort = entityKey === 'cohort'

  const dataExplorerButtonEnabled = isCohort && entitiesCount === 1 && _.values(selectedEntities)[0].attributes.data_explorer_url !== undefined
  const origDataExplorerUrl = dataExplorerButtonEnabled ? _.values(selectedEntities)[0].attributes.data_explorer_url : undefined
  const [baseURL, urlSearch] = origDataExplorerUrl ? origDataExplorerUrl.split('?') : []
  const dataExplorerUrl = origDataExplorerUrl && `${baseURL}?${qs.stringify({ ...qs.parse(urlSearch), wid: workspaceId })}`
  const openDataExplorerInSameTab = dataExplorerUrl &&
    (dataExplorerUrl.includes('terra.bio') || _.some({ origin: new URL(dataExplorerUrl).origin }, datasets))
  const dataset = openDataExplorerInSameTab && getDataset(dataExplorerUrl)
  const linkBase = openDataExplorerInSameTab &&
    Nav.getLink(dataset.authDomain ? 'data-explorer-private' : 'data-explorer-public', { dataset: dataset.name })
  const dataExplorerPath = openDataExplorerInSameTab && `${linkBase}?${dataExplorerUrl.split('?')[1]}`

  const notebookButtonEnabled = isCohort && entitiesCount === 1

  const { title, drawerContent } = Utils.switchCase(toolMode, [
    'IGV', () => ({
      title: 'IGV',
      drawerContent: h(IGVFileSelector, {
        onSuccess: onIgvSuccess,
        selectedEntities
      })
    })
  ], [
    'Workflow', () => ({
      title: 'YOUR WORKFLOWS',
      drawerContent: h(WorkflowSelector, { workspace, selectedEntities })
    })
  ], [
    //TODO: Does this need to change with analysis tab migration? Need PO input
    'Notebook', () => ({
      drawerContent: h(NotebookCreator, {
        bucketName, googleProject,
        existingNames: notebookNames,
        onSuccess: async (notebookName, notebookKernel) => {
          const cohortName = _.values(selectedEntities)[0].name
          const contents = notebookKernel === 'r' ? cohortRNotebook(cohortName) : cohortNotebook(cohortName)
          await Buckets.notebook(googleProject, bucketName, notebookName).create(JSON.parse(contents))
          Ajax().Metrics.captureEvent(Events.workspaceDataOpenWithNotebook, extractWorkspaceDetails(workspace.workspace))
          Nav.goToPath('workspace-notebook-launch', { namespace, name: wsName, notebookName: `${notebookName}.ipynb` })
        },
        onDismiss: () => setToolMode(undefined),
        reloadList: _.noop
      })
    })
  ], [
    Utils.DEFAULT, () => ({
      title: 'OPEN WITH...',
      drawerContent: h(Fragment, [
        div({ style: Style.modalDrawer.content }, [
          div([
            h(ModalToolButton, {
              onClick: () => setToolMode('IGV'),
              disabled: isCohort,
              tooltip: isCohort ? 'IGV cannot be opened with cohorts' : 'Open with Integrative Genomics Viewer',
              icon: igvLogo,
              text: 'IGV'
            }),
            h(ModalToolButton, {
              onClick: () => setToolMode('Workflow'),
              disabled: isCohort,
              tooltip: isCohort ? 'Workflow cannot be opened with cohorts' : 'Open with Workflow',
              icon: wdlLogo,
              text: 'Workflow'
            }),
            h(ModalToolButton, {
              onClick: () => {
                Ajax().Metrics.captureEvent(Events.workspaceDataOpenWithDataExplorer, extractWorkspaceDetails(workspace.workspace))
                !openDataExplorerInSameTab && onDismiss()
              },
              href: openDataExplorerInSameTab ? dataExplorerPath : dataExplorerUrl,
              ...(!openDataExplorerInSameTab ? Utils.newTabLinkProps : {}),
              disabled: !dataExplorerButtonEnabled,
              tooltip: Utils.cond(
                [!entityMetadata.cohort,
                  () => 'Talk to your dataset owner about setting up a Data Explorer. See the "Making custom cohorts with Data Explorer" help article.'],
                [isCohort && entitiesCount > 1, () => 'Select exactly one cohort to open in Data Explorer'],
                [isCohort && !dataExplorerUrl, () => 'Cohort is too old, please recreate in Data Explorer and save to Terra again'],
                [!isCohort, () => 'Only cohorts can be opened with Data Explorer']
              ),
              icon: dataExplorerLogo,
              text: 'Data Explorer'
            }),
            h(ModalToolButton, {
              onClick: () => setToolMode('Notebook'),
              disabled: !notebookButtonEnabled,
              tooltip: Utils.cond(
                [!entityMetadata.cohort,
                  () => 'Unable to open with notebooks. See the "Making custom cohorts with Data Explorer" help article for more details.'],
                [isCohort && entitiesCount > 1, () => 'Select exactly one cohort to open in notebook'],
                [!isCohort, () => 'Only cohorts can be opened with notebooks'],
                [notebookButtonEnabled, () => 'Create a Python 2 or 3 notebook with this cohort']
              ),
              icon: jupyterLogo,
              text: 'Notebook'
            })
          ])
        ])
      ])
    })
  ])

  return div({ style: { padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 } }, [
    h(TitleBar, {
      id: toolDrawerId,
      title,
      onPrevious: toolMode ? () => { setToolMode(undefined) } : undefined,
      onDismiss
    }),
    div({
      style: {
        borderRadius: '1rem',
        border: `1px solid ${colors.dark(0.5)}`,
        padding: '0.25rem 0.875rem',
        margin: '0.5rem 0 2rem',
        alignSelf: 'flex-start',
        fontSize: 12
      }
    }, [
      `${entitiesCount} ${entityKey + (entitiesCount > 1 ? 's' : '')} selected`
    ]),
    drawerContent
  ])
})

const EntitiesContent = ({
  workspace, workspace: {
    workspace: { namespace, name, googleProject, attributes: { 'workspace-column-defaults': columnDefaults } }, workspaceSubmissionStats: { runningSubmissionsCount }
  },
  entityKey, filterTerms, crossTableSearching, entityMetadata, setEntityMetadata, loadMetadata, firstRender, snapshotName, deleteColumnUpdateMetadata
}) => {
  // State
  const [selectedEntities, setSelectedEntities] = useState({})
  const [editingEntities, setEditingEntities] = useState(false)
  const [deletingEntities, setDeletingEntities] = useState(false)
  const [copyingEntities, setCopyingEntities] = useState(false)
  const [addingEntity, setAddingEntity] = useState(false)
  const [nowCopying, setNowCopying] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showToolSelector, setShowToolSelector] = useState(false)
  const [igvFiles, setIgvFiles] = useState(undefined)
  const [igvRefGenome, setIgvRefGenome] = useState('')

  const downloadForm = useRef()

  // Render helpers
  const renderDownloadButton = columnSettings => {
    const disabled = entityKey.endsWith('_set_set')
    return h(Fragment, [
      form({
        ref: downloadForm,
        action: `${getConfig().orchestrationUrlRoot}/cookie-authed/workspaces/${namespace}/${name}/entities/${entityKey}/tsv`,
        method: 'POST'
      }, [
        input({ type: 'hidden', name: 'FCtoken', value: getUser().token }),
        input({ type: 'hidden', name: 'attributeNames', value: _.map('name', _.filter('visible', columnSettings)).join(',') }),
        input({ type: 'hidden', name: 'model', value: 'flexible' })
      ]),
      h(ButtonPrimary, {
        style: { marginRight: '1rem' },
        disabled,
        tooltip: disabled ?
          'Downloading sets of sets as TSV is not supported at this time' :
          `Download a .tsv file containing all the ${entityKey}s in this table`,
        onClick: () => {
          downloadForm.current.submit()
          Ajax().Metrics.captureEvent(Events.workspaceDataDownload, {
            ...extractWorkspaceDetails(workspace.workspace),
            downloadFrom: 'all rows',
            fileType: '.tsv'
          })
        }
      }, [
        icon('download', { style: { marginRight: '0.5rem' } }),
        'Download all Rows'
      ])
    ])
  }

  const buildTSV = (columnSettings, entities) => {
    const sortedEntities = _.sortBy('name', entities)
    const isSet = _.endsWith('_set', entityKey)
    const setRoot = entityKey.slice(0, -4)
    const attributeNames = _.flow(
      _.filter('visible'),
      _.map('name'),
      isSet ? _.without([`${setRoot}s`]) : _.identity
    )(columnSettings)

    const entityTsv = Utils.makeTSV([
      [`entity:${entityKey}_id`, ...attributeNames],
      ..._.map(({ name, attributes }) => {
        return [name, ..._.map(attribute => Utils.entityAttributeText(attributes[attribute], true), attributeNames)]
      }, sortedEntities)
    ])

    if (isSet) {
      const membershipTsv = Utils.makeTSV([
        [`membership:${entityKey}_id`, setRoot],
        ..._.flatMap(({ attributes, name }) => {
          return _.map(({ entityName }) => [name, entityName], attributes[`${setRoot}s`].items)
        }, sortedEntities)
      ])

      const zipFile = new JSZip()
        .file(`${entityKey}_entity.tsv`, entityTsv)
        .file(`${entityKey}_membership.tsv`, membershipTsv)

      return zipFile.generateAsync({ type: 'blob' })
    } else {
      return entityTsv
    }
  }

  const downloadSelectedRows = async columnSettings => {
    const tsv = buildTSV(columnSettings, selectedEntities)
    const isSet = _.endsWith('_set', entityKey)
    isSet ?
      FileSaver.saveAs(await tsv, `${entityKey}.zip`) :
      FileSaver.saveAs(new Blob([tsv], { type: 'text/tab-separated-values' }), `${entityKey}.tsv`)
    Ajax().Metrics.captureEvent(Events.workspaceDataDownloadPartial, {
      ...extractWorkspaceDetails(workspace.workspace),
      downloadFrom: 'table data',
      fileType: '.tsv'
    })
  }

  const renderCopyButton = (entities, columnSettings) => {
    return h(Fragment, [
      h(ButtonPrimary, {
        tooltip: `Copy only the ${entityKey}s visible on the current page to the clipboard in .tsv format`,
        onClick: _.flow(
          withErrorReporting('Error copying to clipboard'),
          Utils.withBusyState(setNowCopying)
        )(async () => {
          const str = buildTSV(columnSettings, entities)
          await clipboard.writeText(str)
          notify('success', 'Successfully copied to clipboard', { timeout: 3000 })
        })
      }, [
        icon('copy-to-clipboard', { style: { marginRight: '0.5rem' } }),
        'Copy Page to Clipboard'
      ]),
      nowCopying && spinner()
    ])
  }

  const renderSelectedRowsMenu = columnSettings => {
    const noEdit = Utils.editWorkspaceError(workspace)
    const disabled = entityKey.endsWith('_set_set')

    return !_.isEmpty(selectedEntities) && h(MenuTrigger, {
      side: 'bottom',
      closeOnClick: true,
      content: h(Fragment, [
        h(MenuButton, {
          disabled,
          tooltip: disabled ?
            'Downloading sets of sets as TSV is not supported at this time' :
            `Download the selected data as a file`,
          onClick: () => downloadSelectedRows(columnSettings)
        }, ['Download as TSV']),
        !snapshotName && h(MenuButton, {
          disabled: noEdit,
          tooltip: noEdit ? 'You don\'t have permission to modify this workspace.' : 'Edit an attribute of the selected rows',
          onClick: () => setEditingEntities(true)
        }, ['Edit Attribute']),
        !snapshotName && h(MenuButton, {
          tooltip: 'Open the selected data to work with it',
          onClick: () => setShowToolSelector(true)
        }, ['Open with...']),
        !snapshotName && h(MenuButton, {
          tooltip: 'Send the selected data to another workspace',
          onClick: () => setCopyingEntities(true)
        }, ['Export to Workspace']),
        !snapshotName && h(MenuButton, {
          tooltip: noEdit ? 'You don\'t have permission to modify this workspace' : 'Permanently delete the selected data',
          disabled: noEdit,
          onClick: () => setDeletingEntities(true)
        }, ['Delete Data'])
      ])
    }, [h(Link, { style: { marginRight: '1rem' } }, [
      icon('ellipsis-v-circle', { size: 24, 'aria-label': 'selection menu' })
    ])])
  }

  const entitiesSelected = !_.isEmpty(selectedEntities)
  const editErrorMessage = Utils.editWorkspaceError(workspace)
  const canEdit = !editErrorMessage

  const renderEditMenu = () => {
    return !snapshotName && h(MenuTrigger, {
      side: 'bottom',
      closeOnClick: true,
      content: h(Fragment, [
        h(MenuButton, {
          onClick: () => setAddingEntity(true)
        }, 'Add row'),
        h(MenuButton, {
          disabled: !entitiesSelected,
          tooltip: !entitiesSelected && 'Select rows to edit in the table',
          onClick: () => setEditingEntities(true)
        }, ['Edit attribute']),
        h(MenuButton, {
          disabled: !entitiesSelected,
          tooltip: !entitiesSelected && 'Select rows to delete in the table',
          onClick: () => setDeletingEntities(true)
        }, 'Delete')
      ])
    }, [h(ButtonSecondary, {
      disabled: !canEdit,
      tooltip: Utils.cond(
        [!canEdit, () => editErrorMessage],
        () => 'Edit data'
      ),
      style: { marginRight: '1.5rem' }
    }, [icon('edit', { style: { marginRight: '0.5rem' } }), 'Edit'])])
  }

  const renderExportMenu = ({ columnSettings }) => {
    const isSetOfSets = entityKey.endsWith('_set_set')

    return h(MenuTrigger, {
      side: 'bottom',
      closeOnClick: true,
      content: h(Fragment, [
        h(MenuButton, {
          disabled: isSetOfSets,
          tooltip: isSetOfSets && 'Downloading sets of sets as TSV is not supported at this time.',
          onClick: () => downloadSelectedRows(columnSettings)
        }, 'Download as TSV'),
        !snapshotName && h(MenuButton, {
          onClick: () => setCopyingEntities(true)
        }, 'Export to workspace'),
        h(MenuButton, {
          disabled: isSetOfSets,
          tooltip: isSetOfSets && 'Copying sets of sets is not supported at this time.',
          onClick: _.flow(
            withErrorReporting('Error copying to clipboard.'),
            Utils.withBusyState(setNowCopying)
          )(async () => {
            const str = buildTSV(columnSettings, _.values(selectedEntities))
            await clipboard.writeText(str)
            notify('success', 'Successfully copied to clipboard.', { timeout: 3000 })
          })
        }, 'Copy to clipboard')
      ])
    }, [h(ButtonSecondary, {
      disabled: !entitiesSelected,
      tooltip: entitiesSelected ? 'Export selected data' : 'Select rows to export in the table',
      style: { marginRight: '1.5rem' }
    }, [
      icon(nowCopying ? 'loadingSpinner' : 'export', { style: { marginRight: '0.5rem' } }),
      'Export'
    ])])
  }

  const renderOpenWithMenu = () => {
    return !snapshotName && h(ButtonSecondary, {
      disabled: !entitiesSelected,
      tooltip: entitiesSelected ? 'Open selected data' : 'Select rows to open in the table',
      onClick: () => setShowToolSelector(true)
    }, [icon('expand-arrows-alt', { style: { marginRight: '0.5rem' } }), 'Open with...'])
  }

  // Render
  const { initialX, initialY } = firstRender ? StateHistory.get() : {}
  const selectedKeys = _.keys(selectedEntities)
  const selectedLength = selectedKeys.length

  return igvFiles ?
    h(IGVBrowser, { selectedFiles: igvFiles, refGenome: igvRefGenome, workspace, onDismiss: () => setIgvFiles(undefined) }) :
    h(Fragment, [
      h(DataTable, {
        persist: true, firstRender, refreshKey, editable: !snapshotName && !Utils.editWorkspaceError(workspace),
        entityType: entityKey, filterTerms, crossTableSearching, entityMetadata, setEntityMetadata, columnDefaults, googleProject, workspaceId: { namespace, name }, workspace,
        onScroll: saveScroll, initialX, initialY,
        snapshotName,
        selectionModel: {
          selected: selectedEntities,
          setSelected: setSelectedEntities
        },
        childrenBefore: ({ entities, columnSettings }) => div({ style: { display: 'flex', alignItems: 'center', flex: 'none' } },
          isDataTabRedesignEnabled() ? [
            renderExportMenu({ columnSettings }),
            renderEditMenu(),
            renderOpenWithMenu(),
            div({ style: { margin: '0 1.5rem', height: '100%', borderLeft: Style.standardLine } }),
            div({
              role: 'status',
              'aria-atomic': true,
              style: { marginRight: '0.5rem' }
            }, [`${selectedLength} row${selectedLength === 1 ? '' : 's'} selected`])
          ] : [
            !snapshotName && renderDownloadButton(columnSettings),
            !_.endsWith('_set', entityKey) && renderCopyButton(entities, columnSettings),
            div({ style: { margin: '0 1.5rem', height: '100%', borderLeft: Style.standardLine } }),
            div({
              role: 'status',
              'aria-atomic': true,
              style: { marginRight: '0.5rem' }
            }, [`${selectedLength} row${selectedLength === 1 ? '' : 's'} selected`]),
            renderSelectedRowsMenu(columnSettings)
          ]),
        deleteColumnUpdateMetadata
      }),
      addingEntity && h(AddEntityModal, {
        entityType: entityKey,
        attributeNames: entityMetadata[entityKey].attributeNames,
        entityTypes: _.keys(entityMetadata),
        workspaceId: { namespace, name },
        onDismiss: () => setAddingEntity(false),
        onSuccess: () => setRefreshKey(_.add(1))
      }),
      editingEntities && h(MultipleEntityEditor, {
        entityType: entityKey,
        entityNames: _.keys(selectedEntities),
        attributeNames: entityMetadata[entityKey].attributeNames,
        entityTypes: _.keys(entityMetadata),
        workspaceId: { namespace, name },
        onDismiss: () => setEditingEntities(false),
        onSuccess: () => {
          setEditingEntities(false)
          setRefreshKey(_.add(1))
        }
      }),
      deletingEntities && h(EntityDeleter, {
        onDismiss: () => setDeletingEntities(false),
        onSuccess: () => {
          setDeletingEntities(false)
          setSelectedEntities({})
          setRefreshKey(_.add(1))
          Ajax().Metrics.captureEvent(Events.workspaceDataDelete, extractWorkspaceDetails(workspace.workspace))
          loadMetadata()
        },
        namespace, name,
        selectedEntities, selectedDataType: entityKey, runningSubmissionsCount
      }),
      copyingEntities && h(ExportDataModal, {
        onDismiss: () => setCopyingEntities(false),
        workspace,
        selectedEntities: selectedKeys, selectedDataType: entityKey, runningSubmissionsCount
      }),
      h(ToolDrawer, {
        workspace,
        isOpen: showToolSelector,
        onDismiss: () => setShowToolSelector(false),
        onIgvSuccess: ({ selectedFiles, refGenome }) => {
          setShowToolSelector(false)
          setIgvFiles(selectedFiles)
          setIgvRefGenome(refGenome)
          Ajax().Metrics.captureEvent(Events.workspaceDataOpenWithIGV, extractWorkspaceDetails(workspace.workspace))
        },
        entityMetadata,
        entityKey,
        selectedEntities
      })
    ])
}

export default EntitiesContent
