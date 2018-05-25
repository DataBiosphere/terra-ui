import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, link, tooltip } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { textInput } from 'src/components/input'
import { TabbedScrollWithHeader, emptyHeader } from 'src/components/ScrollWithHeader'
import { components, DataTable } from 'src/components/table'
import WDLViewer from 'src/components/WDLViewer'
import { Agora, Dockstore, Rawls } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component, Select } from 'src/libs/wrapped-components'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'
import LaunchAnalysisModal from './LaunchAnalysisModal'


const sideMargin = '3rem'

const tableColumns = [
  { label: 'Task name', width: 350 },
  { label: 'Variable', width: 360 },
  { label: 'Type', width: 160 },
  { label: 'Attribute' }
]

const styleForOptional = (optional, text) =>
  span({
    style: {
      fontWeight: !optional && 500,
      fontStyle: optional && 'italic',
      overflow: 'hidden', textOverflow: 'ellipsis'
    }
  }, [text])

const miniMessage = text =>
  span({ style: { fontWeight: 500, fontSize: '75%', marginRight: '1rem', textTransform: 'uppercase' } }, [text])

const preprocessIOList = list => {
  return _.map(entry => {
    const { name, inputType, outputType } = entry
    const type = (inputType || outputType).match(/(.*?)\??$/)[1] // unify, and strip off trailing '?'
    const [task, variable] = _.takeRight(2, _.split('.', name))
    return _.merge(entry, { task, variable, type })
  }, list)
}


class WorkflowView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedTabIndex: 0,
      saved: false,
      modifiedAttributes: { inputs: {}, outputs: {} }
    }
  }

  render() {
    const { config, launching } = this.state
    const { workspaceNamespace, workspaceName, workflowName } = this.props
    const workspaceId = { namespace: workspaceNamespace, name: workspaceName }

    return h(WorkspaceContainer,
      {
        ...workspaceId,
        breadcrumbs: breadcrumbs.commonPaths.workspaceTab(workspaceId, 'tools'),
        title: workflowName, activeTab: 'tools'
      },
      [
        config ?
          h(Fragment, [
            this.renderSummary(),
            this.renderDetails(),
            launching && h(LaunchAnalysisModal, {
              namespace: workspaceNamespace,
              name: workspaceName,
              rootEntityType: config.rootEntityType,
              onDismiss: () => this.setState({ launching: false })
            })
          ]) : centeredSpinner({ style: { marginTop: '2rem' } })
      ]
    )
  }

  async componentDidMount() {
    const { workspaceNamespace, workspaceName, workflowNamespace, workflowName } = this.props
    const workspace = Rawls.workspace(workspaceNamespace, workspaceName)

    const entityTypes = _.map(
      e => ({ value: e, label: e.replace('_', ' ') }),
      _.keys(await workspace.entities())
    )

    const { invalidInputs, invalidOutputs, methodConfiguration: config } =
      await workspace.methodConfig(workflowNamespace, workflowName).validate()

    const processIO = _.flow(
      _.update('inputs', preprocessIOList),
      _.update('outputs', preprocessIOList)
    )

    const processedIO = processIO(await Rawls.methodConfigInputsOutputs(config))

    this.setState({
      inputsOutputs: processedIO,
      invalid: this.createInvalidIOMap(invalidInputs, invalidOutputs, config, processedIO),
      config, entityTypes
    })
  }

  componentDidUpdate() {
    const { selectedTabIndex, loadedWdl } = this.state
    if (selectedTabIndex === 2 && !loadedWdl) {
      this.fetchWDL()
    }
  }

  createInvalidIOMap = (invalidInputs, invalidOutputs, config, io = this.state.inputsOutputs) => {
    const findMissing = ioKey => _.flow(
      _.reject('optional'),
      _.filter(({ name }) => !config[ioKey][name]),
      _.map(({ name }) => ({ [name]: 'This attribute is required' })),
      _.mergeAll
    )

    return {
      inputs: _.merge(invalidInputs, findMissing('inputs')(io.inputs)),
      outputs: _.merge(invalidOutputs, findMissing('outputs')(io.outputs))
    }
  }

  renderSummary = () => {
    const { modifiedAttributes, config, entityTypes, invalid, saving, modified } = this.state
    const { name, methodConfigVersion, methodRepoMethod: { methodPath } } = config

    const noLaunchReason = Utils.cond(
      [!_.isEmpty(invalid.inputs) || !_.isEmpty(invalid.outputs), () => 'Add your inputs and outputs to Launch Analysis'],
      [saving || modified, () => 'Save or cancel to Launch Analysis'],
      () => undefined
    )

    return div({ style: { display: 'flex', backgroundColor: Style.colors.section, padding: `1.5rem ${sideMargin} 0` } }, [
      div({ style: { flex: '1', lineHeight: '1.5rem' } }, [
        div({ style: { color: Style.colors.title, fontSize: 24 } }, name),
        div(`V. ${methodConfigVersion}`),
        methodPath && div(`Path: ${methodPath}`),
        div({ style: { textTransform: 'capitalize', display: 'flex', alignItems: 'baseline', marginTop: '0.5rem' } }, [
          'Data Type:',
          Select({
            clearable: false, searchable: false,
            wrapperStyle: { display: 'inline-block', width: 200, marginLeft: '0.5rem' },
            value: modifiedAttributes.rootEntityType || config.rootEntityType,
            onChange: rootEntityType => {
              modifiedAttributes.rootEntityType = rootEntityType.value
              this.setState({ modifiedAttributes, modified: true })
            },
            options: entityTypes
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
    ])
  }

  renderDetails = () => {
    const { invalid, wdl, saving, saved, modified, selectedTabIndex } = this.state

    const tableHeader = div({ style: { display: 'flex' } }, [
      tableColumns.map(({ label, width }, idx) => {
        return div({
          key: label,
          style: {
            flex: width ? `0 0 ${width}px` : '1 1 auto',
            fontWeight: 500, fontSize: 12, padding: '0.5rem 19px',
            borderLeft: idx !== 0 && Style.standardLine
          }
        },
        label)
      })
    ])

    return div({ style: { padding: `2rem ${sideMargin} 0`, backgroundColor: Style.colors.section } }, [
      h(TabbedScrollWithHeader, {
        selectedTabIndex,
        setSelectedTabIndex: selectedTabIndex => this.setState({ selectedTabIndex }),
        negativeMargin: sideMargin,
        contentBackground: Style.colors.background,
        tabs: [
          {
            title: h(Fragment, [
              'Inputs',
              !_.isEmpty(invalid.inputs) && icon('error', {
                size: 28, style: { marginLeft: '0.5rem', color: Style.colors.error }
              })
            ]),
            header: tableHeader,
            children: [this.renderIOTable('inputs')]
          },
          {
            title: h(Fragment, [
              'Outputs',
              !_.isEmpty(invalid.outputs) && icon('error', {
                size: 28, style: { marginLeft: '0.5rem', color: Style.colors.error }
              })
            ]),
            header: tableHeader,
            children: [this.renderIOTable('outputs')]
          },
          {
            title: 'WDL',
            header: emptyHeader({ padding: '0.5rem' }),
            children: [wdl ? div({
              style: {
                flex: '1 1 auto', overflowY: 'auto', maxHeight: 500,
                padding: '0.5rem', backgroundColor: 'white',
                border: Style.standardLine, borderTop: 'unset'
              }
            }, [
              h(WDLViewer, { wdl, readOnly: true })
            ]) : centeredSpinner({ style: { marginTop: '1rem' } })]
          }
        ],
        tabBarExtras: [
          div({ style: { flexGrow: 1 } }),
          saving && miniMessage('Saving...'),
          saved && !saving && !modified && miniMessage('Saved!'),
          modified && buttonPrimary({ disabled: saving, onClick: () => this.save() }, 'Save'),
          modified && link({ style: { margin: '1rem' }, disabled: saving, onClick: () => this.cancel() }, 'Cancel')
        ]
      })
    ])
  }

  renderIOTable = key => {
    const { inputsOutputs, modifiedAttributes, config } = this.state

    return h(DataTable, {
      dataSource: inputsOutputs[key],
      allowPagination: false,
      customComponents: components.scrollWithHeaderTable,
      tableProps: {
        showHeader: false, scroll: { y: 450 },
        rowKey: 'name',
        columns: [
          {
            key: 'task-name', width: 350,
            render: ({ task }) =>
              div({
                style: {
                  fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis'
                }
              }, task)
          },
          {
            key: 'variable', width: 360,
            render: ({ variable, optional }) =>
              styleForOptional(optional, variable)
          },
          {
            key: 'type', width: 160,
            render: ({ type, optional }) =>
              styleForOptional(optional, type)
          },
          {
            key: 'attribute', width: '100%',
            render: ({ name, optional }) => {
              let value = modifiedAttributes[key][name]
              if (value === undefined) {
                value = config[key][name]
              }

              const error = this.state.invalid[key][name]

              return div({ style: { display: 'flex', alignItems: 'center', margin: '-10px -0.5rem -6px 0' } }, [
                textInput({
                  name, value,
                  type: 'search',
                  placeholder: optional ? 'Optional' : 'Required',
                  onChange: e => {
                    modifiedAttributes[key][name] = e.target.value
                    this.setState({ modifiedAttributes, modified: true })
                  }
                }),
                error && tooltip({
                  component: icon('error', {
                    size: 28, style: { marginLeft: '0.5rem', color: Style.colors.error, cursor: 'help' }
                  }),
                  text: error
                })
              ])
            }
          }
        ]
      }
    })
  }

  fetchWDL = async () => {
    const { methodRepoMethod: { sourceRepo, methodNamespace, methodName, methodVersion, methodPath } } = this.state.config

    this.setState({ loadedWdl: true })
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
  }

  save = async () => {
    const { workspaceNamespace, workspaceName, workflowNamespace, workflowName } = this.props
    const { config, modifiedAttributes } = this.state

    this.setState({ saving: true })
    const { invalidInputs, invalidOutputs, methodConfiguration } =
      await Rawls.workspace(workspaceNamespace, workspaceName)
        .methodConfig(workflowNamespace, workflowName)
        .save(_.merge(config, modifiedAttributes))

    this.setState({
      saving: false, saved: true, modified: false,
      modifiedAttributes: { inputs: {}, outputs: {} },
      invalid: this.createInvalidIOMap(invalidInputs, invalidOutputs, methodConfiguration),
      config: methodConfiguration
    })
  }

  cancel = () => {
    this.setState({ modified: false, saved: false, modifiedAttributes: { inputs: {}, outputs: {} } })
  }
}


export const addNavPaths = () => {
  Nav.defPath('workflow', {
    path: '/workspaces/:workspaceNamespace/:workspaceName/tools/:workflowNamespace/:workflowName',
    component: WorkflowView
  })
}
