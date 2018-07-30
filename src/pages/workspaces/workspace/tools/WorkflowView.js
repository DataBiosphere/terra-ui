import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, buttonSecondary, Select, spinnerOverlay } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { AutocompleteTextInput } from 'src/components/input'
import TabBar from 'src/components/TabBar'
import { FlexTable, HeaderCell, TextCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import WDLViewer from 'src/components/WDLViewer'
import { Dockstore, Methods, Workspaces } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import * as JobHistory from 'src/pages/workspaces/workspace/JobHistory'
import LaunchAnalysisModal from 'src/pages/workspaces/workspace/tools/LaunchAnalysisModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const sideMargin = '3rem'

const styleForOptional = optional => ({
  fontWeight: !optional && 500,
  fontStyle: optional && 'italic'
})

const miniMessage = text =>
  span({ style: { fontWeight: 500, fontSize: '75%', marginRight: '1rem', textTransform: 'uppercase' } }, [text])

const errorIcon = b => {
  return b && icon('error', {
    size: 28, style: { marginLeft: '0.5rem', color: Style.colors.error }
  })
}

const styles = {
  messageContainer: {
    height: '2.25rem',
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    bottom: '0.5rem',
    right: sideMargin
  }
}

const WorkflowView = wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceTab(props, 'tools'),
  title: ({ workflowName }) => workflowName, activeTab: 'tools'
},
class WorkflowViewContent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      activeTab: 'inputs',
      ...StateHistory.get()
    }
  }

  render() {
    const { isFreshData, savedConfig, launching, inputsOutputs, activeTab } = this.state
    const { namespace, name } = this.props

    const workspaceId = { namespace, name }
    const invalidIO = savedConfig && {
      inputs: _.some('error', inputsOutputs.inputs),
      outputs: _.some('error', inputsOutputs.outputs)
    }

    return h(Fragment, [
      savedConfig && h(Fragment, [
        this.renderSummary(invalidIO),
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
    const { namespace, name, workspace: { workspace: { attributes } }, workflowNamespace, workflowName } = this.props
    try {
      const ws = Workspaces.workspace(namespace, name)

      const [entityMetadata, validationResponse] = await Promise.all([
        ws.entityMetadata(),
        ws.methodConfig(workflowNamespace, workflowName).validate()
      ])

      const { methodConfiguration: config } = validationResponse
      const ioDefinitions = await Methods.configInputsOutputs(config)

      const inputsOutputs = this.createIOLists(validationResponse, ioDefinitions)

      this.setState({
        isFreshData: true, savedConfig: config, modifiedConfig: config,
        entityMetadata, inputsOutputs, ioDefinitions,
        workspaceAttributes: _.flow(
          _.without(['description']),
          _.remove(s => s.includes(':'))
        )(_.keys(attributes))
      })
    } catch (error) {
      reportError('Error loading data', error)
    }
  }

  createIOLists(validationResponse, ioDefinitions = this.state.ioDefinitions) {
    const { invalidInputs, invalidOutputs, methodConfiguration: config } = validationResponse

    const invalid = {
      inputs: invalidInputs,
      outputs: invalidOutputs
    }

    const process = ioKey => _.map(({ name, inputType, outputType, optional }) => {
      const value = config[ioKey][name]
      const [task, variable] = _.takeRight(2, _.split('.', name))
      const type = (inputType || outputType).match(/(.*?)\??$/)[1] // unify, and strip off trailing '?'
      const error = !optional && !value ? 'This attribute is required' : invalid[ioKey][name]

      return { name, task, variable, optional, value, type, error }
    })

    return {
      inputs: process('inputs')(ioDefinitions.inputs),
      outputs: process('outputs')(ioDefinitions.outputs)
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

  renderSummary(invalidIO) {
    const { workspace: { canCompute } } = this.props
    const { modifiedConfig, savedConfig, entityMetadata, saving, saved, activeTab } = this.state
    const { name, methodConfigVersion, methodRepoMethod: { methodPath }, rootEntityType } = modifiedConfig
    const modified = !_.isEqual(modifiedConfig, savedConfig)

    const noLaunchReason = Utils.cond(
      [invalidIO.inputs || invalidIO.outputs, () => 'Add your inputs and outputs to Launch Analysis'],
      [saving || modified, () => 'Save or cancel to Launch Analysis']
    )
    return div({ style: { backgroundColor: Style.colors.section, position: 'relative' } }, [
      div({ style: { display: 'flex', padding: `1.5rem ${sideMargin} 0` } }, [
        div({ style: { flex: '1', lineHeight: '1.5rem' } }, [
          div({ style: { color: Style.colors.title, fontSize: 24 } }, name),
          div(`V. ${methodConfigVersion}`),
          methodPath && div(`Path: ${methodPath}`),
          div({ style: { textTransform: 'capitalize', display: 'flex', alignItems: 'baseline', marginTop: '0.5rem' } }, [
            'Data Type:',
            h(Select, {
              clearable: true, searchable: false,
              wrapperStyle: { display: 'inline-block', width: 200, marginLeft: '0.5rem' },
              value: rootEntityType,
              onChange: selected => {
                const value = !!selected ? selected.value : undefined

                this.setState(_.set(['modifiedConfig', 'rootEntityType'], value))
              },
              options: _.map(k => ({ value: k, label: _.startCase(k) }), _.keys(entityMetadata))
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
              backgroundColor: Style.colors.warningBackground,
              color: Style.colors.warning
            }
          }, noLaunchReason)
        ])
      ]),
      h(TabBar, {
        style: { paddingLeft: sideMargin, marginTop: '1rem' },
        tabs: [
          { key: 'inputs', title: h(Fragment, ['Inputs', errorIcon(invalidIO.inputs)]) },
          { key: 'outputs', title: h(Fragment, ['Outputs', errorIcon(invalidIO.outputs)]) },
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

  renderIOTable(key) {
    const { workspace: { canCompute } } = this.props
    const { modifiedConfig, inputsOutputs: { [key]: data }, entityMetadata, workspaceAttributes } = this.state
    // Sometimes we're getting totally empty metadata. Not sure if that's valid; if not, revert this
    const { attributeNames } = entityMetadata[modifiedConfig.rootEntityType] || {}
    const suggestions = [
      ..._.map(name => `this.${name}`, attributeNames),
      ..._.map(name => `workspace.${name}`, workspaceAttributes)
    ]

    return div({ style: { margin: `1rem ${sideMargin} 0`, flexGrow: 1, minHeight: 500 } }, [
      h(AutoSizer, {}, [
        ({ width, height }) => {
          return h(FlexTable, {
            width, height,
            rowCount: data.length,
            columns: [
              {
                size: { basis: 350, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Task name']),
                cellRenderer: ({ rowIndex }) => {
                  return h(TextCell, { style: { fontWeight: 500 } }, [data[rowIndex].task])
                }
              },
              {
                size: { basis: 360, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Variable']),
                cellRenderer: ({ rowIndex }) => {
                  const { variable, optional } = data[rowIndex]
                  return h(TextCell, { style: styleForOptional(optional) }, [variable])
                }
              },
              {
                size: { basis: 160, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Type']),
                cellRenderer: ({ rowIndex }) => {
                  const { type, optional } = data[rowIndex]
                  return h(TextCell, { style: styleForOptional(optional) }, [type])
                }
              },
              {
                headerRenderer: () => h(HeaderCell, ['Attribute']),
                cellRenderer: ({ rowIndex }) => {
                  const { name, optional, error } = data[rowIndex]
                  const value = modifiedConfig[key][name] || ''
                  return div({ style: { display: 'flex', alignItems: 'center', width: '100%' } }, [
                    canCompute ? h(AutocompleteTextInput, {
                      spellCheck: false,
                      placeholder: optional ? 'Optional' : 'Required',
                      value,
                      onChange: v => this.setState(_.set(['modifiedConfig', key, name], v)),
                      suggestions
                    }) : div({ style: { flex: 1 } }, [value]),
                    error && h(TooltipTrigger, { content: error }, [
                      icon('error', {
                        size: 28, style: { marginLeft: '0.5rem', color: Style.colors.error, cursor: 'help' }
                      })
                    ])
                  ])
                }
              }
            ]
          })
        }
      ])
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
    const { namespace, name, workflowNamespace, workflowName } = this.props
    const { modifiedConfig } = this.state

    this.setState({ saving: true })

    try {
      const validationResponse = await Workspaces.workspace(namespace, name)
        .methodConfig(workflowNamespace, workflowName)
        .save(modifiedConfig)
      const inputsOutputs = this.createIOLists(validationResponse)

      this.setState({
        saved: true,
        inputsOutputs,
        savedConfig: validationResponse.methodConfiguration,
        modifiedConfig: validationResponse.methodConfiguration
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
})


export const addNavPaths = () => {
  Nav.defPath('workflow', {
    path: '/workspaces/:namespace/:name/tools/:workflowNamespace/:workflowName',
    component: WorkflowView,
    title: ({ name, workflowName }) => `${name} - Tools - ${workflowName}`
  })
}
