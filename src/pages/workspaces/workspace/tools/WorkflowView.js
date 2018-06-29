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
import { Agora, Dockstore, Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import LaunchAnalysisModal from 'src/pages/workspaces/workspace/tools/LaunchAnalysisModal'
import * as JobHistory from 'src/pages/workspaces/workspace/JobHistory'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'


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

class WorkflowView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      activeTab: 'inputs',
      saved: false,
      modifiedAttributes: {},
      workspaceAttributes: undefined,
      ...StateHistory.get()
    }
  }

  getModifiedConfig() {
    const { config, modifiedAttributes } = this.state
    return _.merge(config, modifiedAttributes)
  }

  render() {
    const { isFreshData, config, launching, inputsOutputs, activeTab } = this.state
    const { workspaceNamespace, workspaceName, workflowName } = this.props

    const workspaceId = { namespace: workspaceNamespace, name: workspaceName }
    const invalidIO = config && {
      inputs: _.some('error', inputsOutputs.inputs),
      outputs: _.some('error', inputsOutputs.outputs)
    }

    return h(WorkspaceContainer,
      {
        ...workspaceId,
        breadcrumbs: breadcrumbs.commonPaths.workspaceTab(workspaceId, 'tools'),
        title: workflowName, activeTab: 'tools'
      },
      [
        config && h(Fragment, [
          this.renderSummary(invalidIO),
          Utils.cond(
            [activeTab === 'inputs', () => this.renderIOTable('inputs')],
            [activeTab === 'outputs', () => this.renderIOTable('outputs')],
            [activeTab === 'wdl', () => this.renderWDL()],
            null,
          ),
          launching && h(LaunchAnalysisModal, {
            workspaceId, config,
            onDismiss: () => this.setState({ launching: false }),
            onSuccess: submissionId => {
              JobHistory.flagNewSubmission(submissionId)
              Nav.goToPath('workspace-job-history', workspaceId)
            }
          })
        ]),
        !isFreshData && spinnerOverlay
      ]
    )
  }

  async componentDidMount() {
    const { workspaceNamespace, workspaceName, workflowNamespace, workflowName } = this.props
    try {
      const workspace = Rawls.workspace(workspaceNamespace, workspaceName)

      const [entityMetadata, workspaceDetails, validationResponse] = await Promise.all([
        workspace.entityMetadata(),
        workspace.details(),
        workspace.methodConfig(workflowNamespace, workflowName).validate()
      ])

      const { methodConfiguration: config } = validationResponse
      const ioDefinitions = await Rawls.methodConfigInputsOutputs(config)

      const inputsOutputs = this.createIOLists(validationResponse, ioDefinitions)

      this.setState({
        isFreshData: true, config, entityMetadata, inputsOutputs, ioDefinitions,
        workspaceAttributes: _.flow(
          _.without(['description']),
          _.remove(s => s.includes(':'))
        )(_.keys(workspaceDetails.workspace.attributes))
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
      const error = Utils.cond(
        [optional && !value, () => undefined],
        [!value, () => 'This attribute is required'],
        () => invalid[ioKey][name]
      )

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
      ['config', 'entityMetadata', 'inputsOutputs', 'invalid', 'modifiedAttributes', 'activeTab', 'wdl'],
      this.state)
    )
  }

  renderSummary = invalidIO => {
    const { entityMetadata, saving, saved, activeTab, modifiedAttributes } = this.state
    const { name, methodConfigVersion, methodRepoMethod: { methodPath }, rootEntityType } = this.getModifiedConfig()
    const modified = !_.isEmpty(modifiedAttributes)

    const noLaunchReason = Utils.cond(
      [invalidIO.inputs || invalidIO.outputs, () => 'Add your inputs and outputs to Launch Analysis'],
      [saving || modified, () => 'Save or cancel to Launch Analysis'],
      () => undefined
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
              clearable: false, searchable: false,
              wrapperStyle: { display: 'inline-block', width: 200, marginLeft: '0.5rem' },
              value: rootEntityType,
              onChange: ({ value }) => {
                this.setState(_.set(['modifiedAttributes', 'rootEntityType'], value))
              },
              options: _.map(k => ({ value: k, label: _.startCase(k) }), _.keys(entityMetadata))
            })
          ])
        ]),
        div({ style: { flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } }, [
          buttonPrimary({ disabled: noLaunchReason, onClick: () => this.setState({ launching: true }) },
            'Launch analysis'),
          noLaunchReason && div({
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

  renderIOTable = key => {
    const { inputsOutputs: { [key]: data }, entityMetadata, workspaceAttributes } = this.state
    const modifiedConfig = this.getModifiedConfig()
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
                  return div({ style: { display: 'flex', alignItems: 'center', width: '100%' } }, [
                    h(AutocompleteTextInput, {
                      placeholder: optional ? 'Optional' : 'Required',
                      value: modifiedConfig[key][name] || '',
                      onChange: v => this.setState(_.set(['modifiedAttributes', key, name], v)),
                      suggestions
                    }),
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

  fetchWDL = async () => {
    const { methodRepoMethod: { sourceRepo, methodNamespace, methodName, methodVersion, methodPath } } = this.state.config

    this.setState({ loadedWdl: true })
    try {
      const wdl = await (() => {
        switch (sourceRepo) {
          case 'dockstore':
            return Dockstore.getWdl(methodPath, methodVersion).then(({ descriptor }) => descriptor)
          case 'agora':
            return Agora.method(methodNamespace, methodName, methodVersion).get().then(({ payload }) => payload)
          default:
            throw new Error('unknown sourceRepo')
        }
      })()
      this.setState({ wdl })
    } catch (error) {
      reportError('Error loading WDL', error)
    }
  }

  save = async () => {
    const { workspaceNamespace, workspaceName, workflowNamespace, workflowName } = this.props

    this.setState({ saving: true })

    try {
      const validationResponse = await Rawls.workspace(workspaceNamespace, workspaceName)
        .methodConfig(workflowNamespace, workflowName)
        .save(this.getModifiedConfig())
      const inputsOutputs = this.createIOLists(validationResponse)

      this.setState({
        saved: true,
        modifiedAttributes: {},
        inputsOutputs,
        config: validationResponse.methodConfiguration
      })
    } catch (error) {
      reportError('Error saving', error)
    } finally {
      this.setState({ saving: false })
    }
  }

  cancel = () => {
    this.setState({ saved: false, modifiedAttributes: {} })
  }
}


export const addNavPaths = () => {
  Nav.defPath('workflow', {
    path: '/workspaces/:workspaceNamespace/:workspaceName/tools/:workflowNamespace/:workflowName',
    component: WorkflowView,
    title: ({ workspaceName, workflowName }) => `${workspaceName} - Tools - ${workflowName}`
  })
}
