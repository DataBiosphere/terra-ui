import FileSaver from 'file-saver'
import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { createRef, Fragment } from 'react'
import Dropzone from 'react-dropzone'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, buttonSecondary, Clickable, linkButton, MenuButton, Select, spinnerOverlay, menuIcon, MethodLink } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { AutocompleteTextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import StepButtons, { params as StepButtonParams } from 'src/components/StepButtons'
import { FlexTable, HeaderCell, SimpleTable, TextCell } from 'src/components/table'
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
import DeleteToolModal from 'src/pages/workspaces/workspace/tools/DeleteToolModal'
import ExportToolModal from 'src/pages/workspaces/workspace/tools/ExportToolModal'
import LaunchAnalysisModal from 'src/pages/workspaces/workspace/tools/LaunchAnalysisModal'
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
    marginTop: '.1rem',
    color: colors.blue[0]
  },
  outputInfoLabel: {
    color: colors.darkBlue[0]
  },
  placeholder: {
    fontStyle: 'italic'
  }
}

const ioTask = ({ name }) => _.nth(-2, name.split('.'))
const ioVariable = ({ name }) => _.nth(-1, name.split('.'))
const ioType = ({ inputType, outputType }) => (inputType || outputType).match(/(.*?)\??$/)[1] // unify, and strip off trailing '?'

const WorkflowIOTable = ({ which, inputsOutputs: data, config, errors, onChange, onSetDefaults, onBrowse, suggestions }) => {
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
            headerRenderer: () => h(Fragment, [
              div({ style: { fontWeight: 'bold' } }, ['Attribute']),
              onSetDefaults && h(Fragment, [
                div({ style: { whiteSpace: 'pre' } }, ['  |  ']),
                linkButton({ onClick: onSetDefaults }, ['Use defaults'])
              ])
            ]),
            cellRenderer: ({ rowIndex }) => {
              const { name, optional, inputType } = data[rowIndex]
              const value = config[which][name] || ''
              const error = errors[which][name]
              const isFile = (inputType === 'File') || (inputType === 'File?')
              return div({ style: { display: 'flex', alignItems: 'center', width: '100%' } }, [
                onChange ? h(AutocompleteTextInput, {
                  placeholder: optional ? 'Optional' : 'Required',
                  value,
                  style: isFile ? { borderRadius: '4px 0px 0px 4px', borderRight: 'white' } : undefined,
                  onChange: v => onChange(name, v),
                  suggestions
                }) : h(TextCell, { style: { flex: 1, borderRadius: '4px 0px 0px 4px', borderRight: 'white' } }, value),
                isFile && h(Clickable, {
                  style: {
                    height: '2.25rem',
                    border: `1px solid ${colors.gray[3]}`, borderRadius: '0px 4px 4px 0px',
                    borderLeft: 'white'
                  },
                  onClick: () => onBrowse(name),
                  tooltip: 'Browse bucket files'
                }, [
                  icon('folder-open', {
                    size: 20, style: {
                      height: '2.25rem',
                      marginTop: '0.4rem',
                      marginRight: '0.5rem'
                    }
                  })
                ]),
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

const BucketContentModal = ajaxCaller(class BucketContentModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      prefix: '',
      objects: undefined
    }
  }

  componentDidMount() {
    this.load()
  }

  componentDidUpdate(prevProps) {
    StateHistory.update(_.pick(['objects', 'prefix'], this.state))
  }

  async load(prefix = this.state.prefix) {
    const { workspace: { workspace: { namespace, bucketName } }, ajax: { Buckets } } = this.props
    try {
      this.setState({ loading: true })
      const { items, prefixes } = await Buckets.list(namespace, bucketName, prefix)
      this.setState({ objects: items, prefixes, prefix })
    } catch (error) {
      reportError('Error loading bucket data', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { workspace: { workspace: { bucketName } }, onDismiss, onSelect } = this.props
    const { prefix, prefixes, objects, loading } = this.state
    const prefixParts = _.dropRight(1, prefix.split('/'))
    return h(Modal, {
      style: { flexGrow: 1, backgroundColor: 'white', border: `1px solid ${colors.gray[3]}`, padding: '1rem' },
      activeStyle: { backgroundColor: colors.blue[3], cursor: 'copy' },
      onDismiss,
      title: 'Choose input file',
      showX: true,
      showButtons: false
    }, [
      div([
        _.map(({ label, target }) => {
          return h(Fragment, { key: target }, [
            linkButton({ onClick: () => this.load(target) }, [label]),
            ' / '
          ])
        }, [
          { label: 'Files', target: '' },
          ..._.map(n => {
            return { label: prefixParts[n], target: _.map(s => `${s}/`, _.take(n + 1, prefixParts)).join('') }
          }, _.range(0, prefixParts.length))
        ])
      ]),
      div({ style: { margin: '1rem -1rem 1rem -1rem', borderBottom: `1px solid ${colors.gray[5]}` } }),
      h(SimpleTable, {
        columns: [
          { header: h(HeaderCell, ['Name']), size: { grow: 1 }, key: 'name' }
        ],
        rows: [
          ..._.map(p => {
            return {
              name: h(TextCell, [
                linkButton({ onClick: () => this.load(p) }, [p.slice(prefix.length)])
              ])
            }
          }, prefixes),
          ..._.map(({ name }) => {
            return {
              name: h(TextCell, [
                linkButton({ onClick: () => onSelect(`"gs://${bucketName}/${name}"`) }, [
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
})

class TextCollapse extends Component {
  static propTypes = {
    defaultHidden: PropTypes.bool,
    showIcon: PropTypes.bool,
    children: PropTypes.node
  }

  static defaultProps = {
    defaultHidden: false,
    showIcon: true
  }

  constructor(props) {
    super(props)
    this.state = { isOpened: !props.defaultHidden }
  }

  render() {
    const { showIcon, children, ...props } = _.omit('defaultHidden', this.props)
    const { isOpened } = this.state

    return div(props, [
      div(
        {
          style: styles.description,
          onClick: () => this.setState({ isOpened: !isOpened })
        },
        [
          showIcon && icon(isOpened ? 'angle down' : 'angle right',
            { style: styles.angle, size: 21 }),
          div({
            style: {
              width: '100%', overflow: isOpened ? 'visible' : 'hidden',
              whiteSpace: isOpened ? 'normal' : 'nowrap', textOverflow: 'ellipsis'
            }
          }, [children])
        ])
    ])
  }
}


const WorkflowView = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceTab(props, 'tools'),
    title: ({ workflowName }) => workflowName, activeTab: 'tools',
    showTabBar: false
  }),
  ajaxCaller
)(class WorkflowView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      activeTab: 'inputs',
      includeOptionalInputs: false,
      errors: { inputs: {}, outputs: {} },
      ...StateHistory.get()
    }
    this.uploader = createRef()
  }

  render() {
    const { isFreshData, savedConfig, launching, activeTab, variableSelected, modifiedConfig } = this.state
    const { namespace, name, workspace } = this.props
    const workspaceId = { namespace, name }
    return h(Fragment, [
      savedConfig && h(Fragment, [
        this.renderSummary(),
        Utils.cond(
          [activeTab === 'inputs', () => this.renderIOTable('inputs')],
          [activeTab === 'outputs' && !!modifiedConfig.rootEntityType, () => this.renderIOTable('outputs')],
          [activeTab === 'wdl', () => this.renderWDL()]
        ),
        launching && h(LaunchAnalysisModal, {
          workspaceId, config: savedConfig,
          onDismiss: () => this.setState({ launching: false }),
          onSuccess: submissionId => {
            JobHistory.flagNewSubmission(submissionId)
            Nav.goToPath('workspace-job-history', workspaceId)
          }
        }),
        variableSelected && h(BucketContentModal, {
          workspace,
          onDismiss: () => this.setState({ variableSelected: undefined }),
          onSelect: v => {
            this.setState({ modifiedConfig: _.set(['inputs', variableSelected], v, modifiedConfig), variableSelected: undefined })
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
        entityMetadata, inputsOutputs: _.update('inputs', _.sortBy('optional'), inputsOutputs),
        errors: augmentErrors(validationResponse),
        workspaceAttributes: _.flow(
          _.without(['description']),
          _.remove(s => s.includes(':'))
        )(_.keys(attributes))
      })
      this.fetchInfo(config)
    } catch (error) {
      reportError('Error loading data', error)
    }
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['savedConfig', 'modifiedConfig', 'entityMetadata', 'inputsOutputs', 'invalid', 'activeTab', 'wdl'],
      this.state)
    )
  }

  async fetchInfo(savedConfig) {
    const { methodRepoMethod: { sourceRepo, methodNamespace, methodName, methodVersion, methodPath } } = savedConfig
    const { ajax: { Dockstore, Methods } } = this.props
    try {
      if (sourceRepo === 'agora') {
        const { synopsis, documentation, payload } = await Methods.method(methodNamespace, methodName, methodVersion).get()
        this.setState({ synopsis, documentation, wdl: payload })
      } else if (sourceRepo === 'dockstore') {
        const wdl = await Dockstore.getWdl(methodPath, methodVersion).then(({ descriptor }) => descriptor)
        this.setState({ wdl })
      } else {
        throw new Error('unknown sourceRepo')
      }
    } catch (error) {
      reportError('Error loading WDL', error)
    }
  }

  renderSummary() {
    const { workspace: { canCompute, workspace }, namespace, name: workspaceName } = this.props
    const { modifiedConfig, savedConfig, entityMetadata, saving, saved, copying, deleting, activeTab, errors, synopsis, documentation } = this.state
    const { name, methodRepoMethod: { methodPath, methodVersion, methodNamespace, methodName }, rootEntityType } = modifiedConfig
    const modified = !_.isEqual(modifiedConfig, savedConfig)
    const noLaunchReason = Utils.cond(
      [saving || modified, () => 'Save or cancel to Launch Analysis'],
      [!_.isEmpty(errors.inputs) || !_.isEmpty(errors.outputs), () => 'At least one required attribute is missing or invalid']
    )

    const inputsValid = _.isEmpty(errors.inputs)
    const outputsValid = _.isEmpty(errors.outputs)

    return div({ style: { position: 'relative', backgroundColor: 'white', borderBottom: `2px solid ${colors.blue[0]}` } }, [
      div({ style: { display: 'flex', padding: `1.5rem ${sideMargin} 0`, minHeight: 120 } }, [
        div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0 } }, [
          div({ style: { display: 'flex' } }, [
            span({ style: { marginLeft: '-2rem', width: '2rem' } }, [
              h(PopupTrigger, {
                closeOnClick: true,
                content: h(Fragment, [
                  h(MenuButton, {
                    onClick: () => this.setState({ copying: true })
                  }, [menuIcon('copy'), 'Copy to Another Workspace']),
                  h(MenuButton, {
                    onClick: () => this.setState({ deleting: true })
                  }, [menuIcon('trash'), 'Delete'])
                ])
              }, [
                linkButton({}, [icon('ellipsis-vertical', { size: 22 })])
              ])
            ]),
            span({ style: { color: colors.darkBlue[0], fontSize: 24 } }, name)
          ]),
          div({ style: { marginTop: '0.5rem' } }, `Snapshot ${methodVersion}`),
          div([
            'Source: ', h(MethodLink, {
              config: modifiedConfig,
              target: '_blank'
            }, methodPath ? methodPath : `${methodNamespace}/${methodName}/${methodVersion}`)
          ]),
          div(`Synopsis: ${synopsis ? synopsis : ''}`),
          documentation ?
            h(TextCollapse, {
              defaultHidden: true,
              showIcon: true
            }, [
              documentation
            ]) :
            div({ style: { fontStyle: 'italic', ...styles.description } }, ['No documentation provided']),
          div({ style: { display: 'flex', alignItems: 'baseline', marginTop: '0.5rem' } }, [
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
          ]),
          h(StepButtons, {
            tabs: [
              { key: 'wdl', title: 'Script', isValid: true },
              { key: 'inputs', title: 'Inputs', isValid: inputsValid },
              { key: 'outputs', title: 'Outputs', isValid: outputsValid }
            ],
            activeTab,
            onChangeTab: v => this.setState({ activeTab: v }),
            finalStep: buttonPrimary({
              disabled: !canCompute || !!noLaunchReason,
              tooltip: !canCompute ? 'You do not have access to run analyses on this workspace.' : undefined,
              onClick: () => this.setState({ launching: true }),
              style: {
                height: StepButtonParams.buttonHeight, fontSize: StepButtonParams.fontSize
              }
            }, ['Run analysis'])
          }),
          activeTab === 'outputs' && div({ style: { marginBottom: '1rem' } }, [
            div({ style: styles.outputInfoLabel }, 'Output files will be saved to'),
            div({ style: { display: 'flex', alignItems: 'center' } }, [
              div({ style: { flex: 'none', display: 'flex', width: '1.5rem' } }, [icon('folder', { size: 18 })]),
              div({ style: { flex: 1 } }, [
                'Files / ',
                span({ style: styles.placeholder }, 'submission unique ID'),
                ` / ${methodName} / `,
                span({ style: styles.placeholder }, 'workflow unique ID')
              ])
            ]),
            !!rootEntityType && h(Fragment, [
              div({ style: { margin: '0.5rem 0', borderBottom: `1px solid ${colors.gray[3]}` } }),
              div({ style: styles.outputInfoLabel }, 'Output references will be written to'),
              div({ style: { display: 'flex', alignItems: 'center' } }, [
                div({ style: { flex: 'none', display: 'flex', width: '1.5rem' } }, [icon('listAlt')]),
                `Tables / ${rootEntityType}`
              ]),
              `Fill in the attributes below to add or update columns in your data table`
            ])
          ])
        ]),
        div({ style: { flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } }, [
          linkButton({
            href: Nav.getLink('workspace-tools', { namespace, name: workspaceName })
          }, [
            icon('times', { size: 36 })
          ]),
          canCompute && noLaunchReason && div({
            style: {
              marginTop: '0.5rem', padding: '1rem',
              backgroundColor: colors.orange[5],
              color: colors.orange[0]
            }
          }, noLaunchReason)
        ])
      ]),
      div({ style: styles.messageContainer }, [
        saving && miniMessage('Saving...'),
        saved && !saving && !modified && miniMessage('Saved!'),
        modified && buttonPrimary({ disabled: saving, onClick: () => this.save() }, 'Save'),
        modified && buttonSecondary({ style: { marginLeft: '1rem' }, disabled: saving, onClick: () => this.cancel() }, 'Cancel')
      ]),
      copying && h(ExportToolModal, {
        thisWorkspace: workspace, methodConfig: savedConfig,
        onDismiss: () => this.setState({ copying: false })
      }),
      deleting && h(DeleteToolModal, {
        workspace, methodConfig: savedConfig,
        onDismiss: () => this.setState({ deleting: false }),
        onSuccess: () => Nav.goToPath('workspace-tools', _.pick(['namespace', 'name'], workspace))
      })
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
        JSON.stringify(v)
      )(rawUpdates)
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
    const { modifiedConfig, inputsOutputs, errors, entityMetadata, workspaceAttributes, includeOptionalInputs } = this.state
    // Sometimes we're getting totally empty metadata. Not sure if that's valid; if not, revert this
    const { attributeNames } = entityMetadata[modifiedConfig.rootEntityType] || {}
    const suggestions = [
      ..._.map(name => `this.${name}`, attributeNames),
      ..._.map(name => `workspace.${name}`, workspaceAttributes)
    ]
    const filteredData = _.filter(includeOptionalInputs || key === 'outputs' ? (() => true) : { optional: false }, inputsOutputs[key])

    return h(Dropzone, {
      accept: '.json',
      multiple: false,
      disabled: !canCompute,
      disableClick: true,
      style: { padding: `1rem ${sideMargin}`, flex: 'auto', display: 'flex', flexDirection: 'column' },
      activeStyle: { backgroundColor: colors.blue[3], cursor: 'copy' },
      ref: this.uploader,
      onDropRejected: () => reportError('Not a valid inputs file', 'The selected file is not a json file. To import inputs for this tool, upload a file with a .json extension.'),
      onDropAccepted: files => this.uploadJson(key, files[0])
    }, [
      div({ style: { flex: 'none', display: 'flex', marginBottom: '0.25rem' } }, [
        key === 'inputs' && _.some('optional', inputsOutputs['inputs']) ?
          linkButton({ style: { marginRight: 'auto' }, onClick: () => this.setState({ includeOptionalInputs: !includeOptionalInputs }) }, [includeOptionalInputs ? 'Hide optional inputs' : 'Show optional inputs'])
          : div({ style: { marginRight: 'auto' } }, []),
        linkButton({ onClick: () => this.downloadJson(key) }, ['Download json']),
        div({ style: { whiteSpace: 'pre' } }, ['  |  Drag or click to ']),
        linkButton({ onClick: () => this.uploader.current.open() }, ['upload json'])
      ]),
      filteredData.length !== 0 &&
      div({ style: { flex: '1 0 500px' } }, [
        h(WorkflowIOTable, {
          which: key,
          inputsOutputs: filteredData,
          config: modifiedConfig,
          errors,
          onBrowse: name => this.setState({ variableSelected: name }),
          onChange: canCompute ? ((name, v) => this.setState(_.set(['modifiedConfig', key, name], v))) : undefined,
          onSetDefaults: canCompute && key === 'outputs' ? () => {
            this.setState(_.update(['modifiedConfig', 'outputs'], _.flow(
              _.toPairs,
              _.map(([k, v]) => [k, v || `this.${_.last(k.split('.'))}`]),
              _.fromPairs
            )))
          } : undefined,
          suggestions
        })
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
})


export const addNavPaths = () => {
  Nav.defPath('workflow', {
    path: '/workspaces/:namespace/:name/tools/:workflowNamespace/:workflowName',
    component: WorkflowView,
    title: ({ name, workflowName }) => `${name} - Tools - ${workflowName}`
  })
}
