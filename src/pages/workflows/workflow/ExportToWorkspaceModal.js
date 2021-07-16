import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h2, h3 } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { ButtonPrimary, ButtonSecondary, IdContainer, Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { FlexTable, HeaderCell } from 'src/components/table'
import TitleBar from 'src/components/TitleBar'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { WorkspaceImporter } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { snapshotStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'

import ConfigDetails from './ConfigDetails'


const WorkflowConfigs = ({ onConfigClick = _.noop }) => {
  const signal = Utils.useCancellation()
  const { namespace, name, snapshotId } = Utils.useStore(snapshotStore)
  const [configs, setConfigs] = useState()
  const [displayingConfig, setDisplayingConfig] = useState()

  Utils.useOnMount(() => {
    const loadConfigs = async () => {
      const [allConfigs, snapshotConfigs] = await Promise.all([
        Ajax(signal).Methods.method(namespace, name, snapshotId).allConfigs(),
        Ajax(signal).Methods.method(namespace, name, snapshotId).configs()
      ])

      const configs = _.map(config => _.find(_.isEqual(config), snapshotConfigs) ? config : _.set(['incompatible'], true, config), allConfigs)

      setConfigs(configs)
    }

    loadConfigs()
  })

  return div({ style: { flex: 1, padding: '1rem' }, role: 'tabpanel' }, [
    !configs ?
      centeredSpinner() :
      h(AutoSizer, [
        ({ width, height }) => h(FlexTable, {
          width, height,
          'aria-label': 'workflow configuration',
          rowCount: _.size(configs),
          columns: [
            {
              headerRenderer: () => div({ className: 'sr-only' }, ['Warnings']),
              cellRenderer: ({ rowIndex }) => {
                const config = configs[rowIndex]

                return config.incompatible && h(TooltipTrigger, {
                  content: `This configuration is not fully compatible with this workflow snapshot (${snapshotId})`, side: 'right'
                }, [icon('warning-standard', { style: { color: colors.warning() } })])
              },
              size: { basis: 45, grow: 0, shrink: 0 }
            },
            {
              headerRenderer: () => h(HeaderCell, ['Configuration']),
              cellRenderer: ({ rowIndex }) => {
                const { namespace, name, snapshotId } = configs[rowIndex]

                return h(Link, { onClick: () => onConfigClick(configs[rowIndex]) }, [`${namespace}/${name} Version: ${snapshotId}`])
              },
              size: { basis: 400, grow: 0, shrink: 0 }
            },
            {
              headerRenderer: () => h(HeaderCell, ['Workflow Snapshot']),
              cellRenderer: ({ rowIndex }) => {
                const { payloadObject: { methodRepoMethod: { methodVersion } } } = configs[rowIndex]

                return methodVersion
              },
              size: { basis: 200, grow: 0, shrink: 0 }
            },
            {
              headerRenderer: () => h(HeaderCell, ['Synopsis']),
              cellRenderer: ({ rowIndex }) => {
                const { synopsis } = configs[rowIndex]

                return synopsis
              },
              size: { grow: 2 }
            }
          ]
        })
      ]),
    displayingConfig && h(Modal, {
      width: 'min(95%, 1200px)',
      title: h2({ style: { margin: 0, fontSize: 'inherit' } }, [
        `Configuration ${displayingConfig.namespace}/${displayingConfig.name} Version: ${displayingConfig.snapshotId}`
      ]),
      onDismiss: () => setDisplayingConfig(), showCancel: false
    }, [
      h(ConfigDetails, displayingConfig)
    ])
  ])
}

// const methodAjax = Ajax().Methods.method(namespace, name, snapshotId).toWorkspace({}, config)


const WorkspaceSelection = ({ namespace: workflowNamespace, name: workflowName, snapshotId, onCancel, selectedConfig }) => {
  const [loading, setLoading] = useState()
  const [name, setName] = useState('')

  const configNamespace = selectedConfig?.namespace || workflowNamespace

  const exportToWorkspace = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error exporting workflow to workspace')
  )(async workspace => {
    await Ajax().Methods.method(workflowNamespace, workflowName, snapshotId).toWorkspace(workspace, _.set(['payloadObject', 'name'], name, selectedConfig))
    Nav.goToPath('workflow',
      { namespace: workspace.namespace, name: workspace.name, workflowNamespace: configNamespace, workflowName: name })
  })

  return h(Fragment, [
    h(IdContainer, [id => h(Fragment, [
      h(FormLabel, { htmlFor: id }, ['Name']),
      h(TextInput, { onChange: setName, value: name })
    ])]),

    h(WorkspaceImporter, {
      onImport: exportToWorkspace
    }),
    div({ style: { display: 'flex' } }, [
      h(ButtonSecondary, {
        style: { marginLeft: 'auto' },
        onClick: onCancel
      }, ['Back'])
    ]),
    loading && centeredSpinner()
  ])
}


const ConfigSelection = ({ selectedConfig, setSelectedConfig, onOk }) => {
  return h(Fragment, [
    h3({ style: { fontSize: '1.125rem', margin: '1rem 1rem 0.5rem' } }, ['Select Method Configuration']),
    div({
      style: {
        display: 'grid',
        minHeight: 400,
        gridTemplateRows: 'minmax(200px, auto) 1rem minmax(200px, auto)'
      }
    }, [
      h(WorkflowConfigs, { onConfigClick: setSelectedConfig }),
      div({ style: { borderTop: `1px solid ${colors.light()}`, margin: '1rem 0' } }),
      selectedConfig ?
        div([h(ConfigDetails, selectedConfig)]) :
        div({ style: { fontSize: '1.5rem', alignSelf: 'center', justifySelf: 'center' } }, [
          'Select a Configuration to Preview'
        ])
    ]),
    div({
      style: { marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }
    }, [
      h(ButtonSecondary, {
        onClick: () => {
          setSelectedConfig(undefined)
          onOk()
        }
      }, ['Use Blank Configuration']),
      h(ButtonPrimary, { style: { marginLeft: '1rem' }, disabled: !selectedConfig, onClick: onOk }, ['Use Selected Config'])
    ])
  ])
}

const step = {
  config: 'config',
  workspace: 'workspace'
}

const ExportToWorkspaceModal = ({ title, onDismiss, namespace, name, snapshotId }) => {
  const [selectedConfig, setSelectedConfig] = useState()
  const [view, setView] = useState(step.config)

  return h(Modal, {
    width: view === step.config ? 'max(95%, 1200px)' : 'unset',
    onDismiss,
    showButtons: false
  }, [
    h(TitleBar, { title, onDismiss }),
    view === step.config ?
      h(ConfigSelection, { selectedConfig, setSelectedConfig, onOk: () => setView(step.workspace) }) :
      h(WorkspaceSelection, { namespace, name, snapshotId, selectedConfig, onCancel: () => setView(step.config) })

  ])
}

export default ExportToWorkspaceModal
