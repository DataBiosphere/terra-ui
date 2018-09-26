import FileSaver from 'file-saver'
import _ from 'lodash/fp'
import { createRef, Fragment } from 'react'
import Dropzone from 'react-dropzone'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, buttonSecondary, linkButton, Select, spinnerOverlay } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { AutocompleteTextInput } from 'src/components/input'
import TabBar from 'src/components/TabBar'
import { FlexTable, HeaderCell, TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import WDLViewer from 'src/components/WDLViewer'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import * as JobHistory from 'src/pages/workspaces/workspace/JobHistory'
import LaunchAnalysisModal from 'src/pages/workspaces/workspace/tools/LaunchAnalysisModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const sideMargin = '3rem'

const miniMessage = text =>
  span({ style: { fontWeight: 500, fontSize: '75%', marginRight: '1rem', textTransform: 'uppercase' } }, [text])

const errorIcon = b => {
  return !_.isEmpty(b) && icon('error', {
    size: 28, style: { marginLeft: '0.5rem', color: colors.red[0] }
  })
}

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
  cell: optional => ({
    fontWeight: !optional && 500,
    fontStyle: optional && 'italic'
  })
}

const ioTask = ({ name }) => _.nth(-2, name.split('.'))
const ioVariable = ({ name }) => _.nth(-1, name.split('.'))
const ioType = ({ inputType, outputType }) => (inputType || outputType).match(/(.*?)\??$/)[1] // unify, and strip off trailing '?'

const WorkflowIOTable = ({ which, inputsOutputs, config, errors, onChange, suggestions }) => {
  const data = inputsOutputs[which]
  return h(AutoSizer, [
    ({ width, height }) => {
      return h(FlexTable, {
        width, height,
        rowCount: data.length,
        columns: [
          {
            size: { basis: 350, grow: 0 },
            headerRenderer: () => h(HeaderCell, ['Task name']),
            cellRenderer: ({ rowIndex }) => {
              const io = data[rowIndex]
              return h(TextCell, { style: { fontWeight: 500 } }, [
                ioTask(io)
              ])
            }
          },
          {
            size: { basis: 360, grow: 0 },
            headerRenderer: () => h(HeaderCell, ['Variable']),
            cellRenderer: ({ rowIndex }) => {
              const io = data[rowIndex]
              return h(TextCell, { style: styles.cell(io.optional) }, [ioVariable(io)])
            }
          },
          {
            size: { basis: 160, grow: 0 },
            headerRenderer: () => h(HeaderCell, ['Type']),
            cellRenderer: ({ rowIndex }) => {
              const io = data[rowIndex]
              return h(TextCell, { style: styles.cell(io.optional) }, [ioType(io)])
            }
          },
          {
            headerRenderer: () => h(HeaderCell, ['Attribute']),
            cellRenderer: ({ rowIndex }) => {
              const { name, optional } = data[rowIndex]
              const value = config[which][name] || ''
              const error = errors[which][name]
              return div({ style: { display: 'flex', alignItems: 'center', width: '100%' } }, [
                onChange ? h(AutocompleteTextInput, {
                  placeholder: optional ? 'Optional' : 'Required',
                  value,
                  onChange: v => onChange(name, v),
                  suggestions
                }) : h(TextCell, { style: { flex: 1 } }, value),
                error && h(TooltipTrigger, { content: error }, [
                  icon('error', {
                    size: 28, style: { marginLeft: '0.5rem', color: colors.red[0], cursor: 'help' }
                  })
                ])
              ])
            }
          }
        ]
      })
    }
  ])
}

const WorkflowView = ajaxCaller(wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceTab(props, 'tools'),
  title: ({ workflowName }) => workflowName, activeTab: 'tools'
},
class WorkflowViewContent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      activeTab: 'inputs',
      errors: { inputs: {}, outputs: {} },
      ...StateHistory.get()
    }
    this.uploader = createRef()
  }

  render() {
    const { isFreshData, savedConfig, launching, activeTab } = this.state
    const { namespace, name } = this.props

    const workspaceId = { namespace, name }

    return h(Fragment, [
      savedConfig && h(Fragment, [
        this.renderSummary(),
        Utils.cond(
          [activeTab === 'inputs', () => this.renderIOTable('inputs')],
          [activeTab === 'outputs', () => this.renderIOTable('outputs')],
          [activeTab === 'wdl', () => this.renderWDL()]
        ),
        launching && h(LaunchAnalysisModal, {
          workspaceId, config: savedConfig,
          onDismiss: () => this.setState({ launching: false }),
          onSuccess: submissionId => {
            JobHistory.flagNewSubmission(submissionId)
            Nav.goToPath('workspace-job-history', workspaceId)
          }
        })
      ]),
      !isFreshData && spinnerOverlay
    ])
  }

  async componentDidMount() {
    const {
      namespace, name, workflowNamespace, workflowName,
      workspace: { workspace: { attributes } },
      ajax: { Workspaces, Methods }
    } = this.props

    try {
      const ws = Workspaces.workspace(namespace, name)

      const [entityMetadata, validationResponse] = await Promise.all([
        ws.entityMetadata(),
        ws.methodConfig(workflowNamespace, workflowName).validate()
      ])

      const { methodConfiguration: config } = validationResponse
      const inputsOutputs = await Methods.configInputsOutputs(config)

      this.setState({
        isFreshData: true, savedConfig: config, modifiedConfig: config,
        entityMetadata, inputsOutputs,
        errors: augmentErrors(validationResponse),
        workspaceAttributes: _.flow(
          _.without(['description']),
          _.remove(s => s.includes(':'))
        )(_.keys(attributes))
      })
    } catch (error) {
      reportError('Error loading data', error)
    }
  }

  componentDidUpdate() {
    const { activeTab, loadedWdl } = this.state
    if (activeTab === 'wdl' && !loadedWdl) {
      this.fetchWDL()
    }

    StateHistory.update(_.pick(
      ['savedConfig', 'modifiedConfig', 'entityMetadata', 'inputsOutputs', 'invalid', 'activeTab', 'wdl'],
      this.state)
    )
  }

  renderSummary() {
    const { workspace: { canCompute } } = this.props
    const { modifiedConfig, savedConfig, entityMetadata, saving, saved, activeTab, errors } = this.state
    const { name, methodRepoMethod: { methodPath, methodVersion }, rootEntityType } = modifiedConfig
    const modified = !_.isEqual(modifiedConfig, savedConfig)

    const noLaunchReason = Utils.cond(
      [saving || modified, () => 'Save or cancel to Launch Analysis'],
      [!_.isEmpty(errors.inputs) || !_.isEmpty(errors.outputs), () => 'At least one required attribute is missing or invalid']
    )
    return div({ style: { backgroundColor: colors.blue[5], position: 'relative' } }, [
      div({ style: { display: 'flex', padding: `1.5rem ${sideMargin} 0`, minHeight: 120 } }, [
        div({ style: { flex: '1', lineHeight: '1.5rem' } }, [
          div({ style: { color: colors.darkBlue[0], fontSize: 24 } }, name),
          div(`V. ${methodVersion}`),
          methodPath && div(`Path: ${methodPath}`),
          div({ style: { textTransform: 'capitalize', display: 'flex', alignItems: 'baseline', marginTop: '0.5rem' } }, [
            'Data Type:',
            h(Select, {
              isClearable: true, isSearchable: false,
              styles: { container: old => ({ ...old, display: 'inline-block', width: 200, marginLeft: '0.5rem' }) },
              getOptionLabel: ({ value }) => Utils.normalizeLabel(value),
              value: rootEntityType,
              onChange: selected => {
                const value = !!selected ? selected.value : undefined

                this.setState(_.set(['modifiedConfig', 'rootEntityType'], value))
              },
              options: _.keys(entityMetadata)
            })
          ])
        ]),
        div({ style: { flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } }, [
          buttonPrimary({
            disabled: !canCompute || !!noLaunchReason,
            tooltip: !canCompute ? 'You do not have access to run analyses on this workspace.' : undefined,
            onClick: () => this.setState({ launching: true })
          }, ['Launch analysis']),
          canCompute && noLaunchReason && div({
            style: {
              marginTop: '0.5rem', padding: '1rem',
              backgroundColor: colors.orange[5],
              color: colors.orange[0]
            }
          }, noLaunchReason)
        ])
      ]),
      h(TabBar, {
        style: { paddingLeft: sideMargin, marginTop: '1rem' },
        tabs: [
          { key: 'inputs', title: h(Fragment, ['Inputs', errorIcon(errors.inputs)]) },
          { key: 'outputs', title: h(Fragment, ['Outputs', errorIcon(errors.outputs)]) },
          { key: 'wdl', title: 'WDL' }
        ],
        activeTab,
        onChangeTab: v => this.setState({ activeTab: v })
      }),
      div({ style: styles.messageContainer }, [
        saving && miniMessage('Saving...'),
        saved && !saving && !modified && miniMessage('Saved!'),
        modified && buttonPrimary({ disabled: saving, onClick: () => this.save() }, 'Save'),
        modified && buttonSecondary({ style: { marginLeft: '1rem' }, disabled: saving, onClick: () => this.cancel() }, 'Cancel')
      ])
    ])
  }

  downloadJson(key) {
    const { modifiedConfig } = this.state
    const prepIO = _.mapValues(v => /^".*"/.test(v) ? v.slice(1, -1) : `\${${v}}`)

    const blob = new Blob([JSON.stringify(prepIO(modifiedConfig[key]))], { type: 'application/json' })
    FileSaver.saveAs(blob, `${key}.json`)
  }

  async uploadJson(key, file) {
    try {
      const rawUpdates = JSON.parse(await Utils.readFileAsText(file))
      const updates = _.mapValues(v => _.isString(v) && v.match(/\${(.*)}/) ?
        v.replace(/\${(.*)}/, (_, match) => match) :
        JSON.stringify(v))(rawUpdates)
      this.setState(({ modifiedConfig, inputsOutputs }) => {
        const existing = _.map('name', inputsOutputs[key])
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

  renderIOTable(key) {
    const { workspace: { canCompute } } = this.props
    const { modifiedConfig, inputsOutputs, errors, entityMetadata, workspaceAttributes } = this.state
    // Sometimes we're getting totally empty metadata. Not sure if that's valid; if not, revert this
    const { attributeNames } = entityMetadata[modifiedConfig.rootEntityType] || {}
    const suggestions = [
      ..._.map(name => `this.${name}`, attributeNames),
      ..._.map(name => `workspace.${name}`, workspaceAttributes)
    ]

    return h(Dropzone, {
      accept: '.json',
      multiple: false,
      disabled: !canCompute,
      disableClick: true,
      disablePreview: true,
      style: { padding: `1rem ${sideMargin} 0`, flex: 1, minHeight: 500 },
      activeStyle: { backgroundColor: colors.blue[3], cursor: 'copy' },
      ref: this.uploader,
      onDropRejected: () => reportError('Not a valid inputs file', 'The selected file is not a json file. To import inputs for this tool, upload a file with a .json extension.'),
      onDropAccepted: files => this.uploadJson(key, files[0])
    }, [
      div({ style: { display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' } }, [
        linkButton({ onClick: () => this.downloadJson(key) }, ['Download json']),
        div({ style: { padding: '0 0.5rem' } }, ['|']),
        linkButton({ onClick: () => this.uploader.current.open() }, ['Upload json'])
      ]),
      h(WorkflowIOTable, {
        which: key,
        inputsOutputs,
        config: modifiedConfig,
        errors,
        onChange: canCompute ? ((name, v) => this.setState(_.set(['modifiedConfig', key, name], v))) : undefined,
        suggestions
      })
    ])
  }

  renderWDL() {
    const { wdl } = this.state
    return wdl ? h(WDLViewer, {
      wdl, readOnly: true,
      style: { maxHeight: 500, margin: `1rem ${sideMargin}` }
    }) : centeredSpinner({ style: { marginTop: '1rem' } })
  }

  async fetchWDL() {
    const { methodRepoMethod: { sourceRepo, methodNamespace, methodName, methodVersion, methodPath } } = this.state.savedConfig
    const { ajax: { Dockstore, Methods } } = this.props

    this.setState({ loadedWdl: true })
    try {
      const wdl = await (() => {
        switch (sourceRepo) {
          case 'dockstore':
            return Dockstore.getWdl(methodPath, methodVersion).then(({ descriptor }) => descriptor)
          case 'agora':
            return Methods.method(methodNamespace, methodName, methodVersion).get().then(({ payload }) => payload)
          default:
            throw new Error('unknown sourceRepo')
        }
      })()
      this.setState({ wdl })
    } catch (error) {
      reportError('Error loading WDL', error)
    }
  }

  async save() {
    const { namespace, name, workflowNamespace, workflowName, ajax: { Workspaces } } = this.props
    const { modifiedConfig } = this.state

    this.setState({ saving: true })

    try {
      const validationResponse = await Workspaces.workspace(namespace, name)
        .methodConfig(workflowNamespace, workflowName)
        .save(modifiedConfig)

      this.setState({
        saved: true,
        savedConfig: validationResponse.methodConfiguration,
        modifiedConfig: validationResponse.methodConfiguration,
        errors: augmentErrors(validationResponse)
      }, () => setTimeout(() => this.setState({ saved: false }), 3000))
    } catch (error) {
      reportError('Error saving', error)
    } finally {
      this.setState({ saving: false })
    }
  }

  cancel() {
    const { savedConfig } = this.state

    this.setState({ saved: false, modifiedConfig: savedConfig })
  }
}))


export const addNavPaths = () => {
  Nav.defPath('workflow', {
    path: '/workspaces/:namespace/:name/tools/:workflowNamespace/:workflowName',
    component: WorkflowView,
    title: ({ name, workflowName }) => `${name} - Tools - ${workflowName}`
  })
}
