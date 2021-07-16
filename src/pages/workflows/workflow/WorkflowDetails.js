import * as clipboard from 'clipboard-polyfill/text'
import FileSaver from 'file-saver'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h2, label } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { ButtonPrimary, ButtonSecondary, DashboardInfoTile, IdContainer, Link, Select } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon } from 'src/components/icons'
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown'
import Modal from 'src/components/Modal'
import { TabBar } from 'src/components/tabBars'
import { FlexTable, HeaderCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import TopBar from 'src/components/TopBar'
import WDLViewer from 'src/components/WDLViewer'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { snapshotsListStore, snapshotStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import ConfigDetails from 'src/pages/workflows/workflow/ConfigDetails'
import ExportToWorkspaceModal from 'src/pages/workflows/workflow/ExportToWorkspaceModal'


const WorkflowWrapper = ({ namespace, name, children, tabName, snapshotId }) => {
  const signal = Utils.useCancellation()
  const cachedSnapshotsList = Utils.useStore(snapshotsListStore)
  const selectedSnapshot = (snapshotId * 1) || _.last(cachedSnapshotsList).snapshotId

  const snapshotsList = cachedSnapshotsList && _.isEqual({ namespace, name }, _.pick(['namespace', 'name'], cachedSnapshotsList[0])) ?
    cachedSnapshotsList :
    undefined

  Utils.useOnMount(() => {
    const loadSnapshots = async () => {
      snapshotsListStore.set(snapshotsList || await Ajax(signal).Methods.list({ namespace, name }))
    }

    if (!snapshotsList) {
      loadSnapshots()
    }
  })


  return h(FooterWrapper, [
    h(TopBar, { title: 'Workflows', href: Nav.getLink('workflows') }, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        div(breadcrumbs.commonPaths.workflowList()),
        div({ style: Style.breadcrumb.textUnderBreadcrumb }, [`${namespace}/${name}`])
      ]),
      h(IdContainer, [id => h(Fragment, [
        label({ htmlFor: id, style: { ...Style.tabBarText, fontSize: '1.25rem', marginLeft: '2rem', marginRight: '1rem' } }, ['Snapshot:']),
        div({ style: { width: 100 } }, [
          h(Select, {
            id,
            value: selectedSnapshot,
            isSearchable: false,
            options: _.map('snapshotId', cachedSnapshotsList),
            onChange: ({ value }) => Nav.goToPath(`workflow-${tabName}`, { namespace, name, snapshotId: value })
          })
        ])
      ])])
    ]),
    div({ role: 'main', style: { flex: 1, display: 'flex', flexFlow: 'column nowrap' } }, [
      snapshotsList ?
        children :
        centeredSpinner()
    ])
  ])
}

const SnapshotWrapper = ({ namespace, name, snapshotId, tabName, children }) => {
  const signal = Utils.useCancellation()
  const cachedSnapshotsList = Utils.useStore(snapshotsListStore)
  const cachedSnapshot = Utils.useStore(snapshotStore)
  const [showExportModal, setShowExportModal] = useState(false)
  const selectedSnapshot = (snapshotId * 1) || _.last(cachedSnapshotsList).snapshotId

  const snapshot = cachedSnapshot &&
  _.isEqual({ namespace, name, snapshotId: selectedSnapshot }, _.pick(['namespace', 'name', 'snapshotId'], cachedSnapshot)) ?
    cachedSnapshot :
    undefined

  Utils.useOnMount(() => {
    const loadSnapshot = async () => {
      snapshotStore.set(await Ajax(signal).Methods.method(namespace, name, selectedSnapshot).get())
    }

    if (!snapshot) {
      loadSnapshot()
    }

    if (!snapshotId) {
      window.history.replaceState({}, '', Nav.getLink('workflow-dashboard', { namespace, name, snapshotId: selectedSnapshot }))
    }
  })

  return h(Fragment, [
    h(TabBar, {
      'aria-label': 'workflow menu',
      activeTab: tabName,
      tabNames: ['dashboard', 'wdl', 'configs'],
      displayNames: { configs: 'configurations' },
      getHref: currentTab => Nav.getLink(`workflow-${currentTab}`, { namespace, name, snapshotId: selectedSnapshot })
    }, [
      h(ButtonPrimary, {
        onClick: () => setShowExportModal(true)
      }, ['Export to Workspace'])
    ]),
    showExportModal && h(ExportToWorkspaceModal, {
      namespace, name, snapshotId: selectedSnapshot,
      title: `Export ${name} to Workspace`, onDismiss: () => setShowExportModal(false)
    }),
    snapshot ?
      children :
      centeredSpinner()
  ])
}

const WorkflowSummary = () => {
  const { namespace, name, snapshotId, createDate, managers, synopsis, documentation, public: isPublic } = Utils.useStore(snapshotStore)
  const [importUrlCopied, setImportUrlCopied] = useState()
  const importUrl = `${getConfig().orchestrationUrlRoot}/ga4gh/v1/tools/${namespace}:${name}/versions/${snapshotId}/plain-WDL/descriptor`

  return div({ style: { flex: 1, display: 'flex' }, role: 'tabpanel' }, [
    div({ style: Style.dashboard.leftBox }, [
      synopsis && h(Fragment, [
        h2({ style: Style.dashboard.header }, ['Synopsis']),
        div({ style: { fontSize: 16 } }, [synopsis])
      ]),
      h2({ style: Style.dashboard.header }, ['Documentation']),
      !!documentation ?
        h(MarkdownViewer, { renderers: { link: newWindowLinkRenderer } }, [documentation]) :
        div({ style: { fontStyle: 'italic' } }, ['No documentation provided'])
    ]),
    div({ style: Style.dashboard.rightBox }, [
      h2({ style: Style.dashboard.header }, ['Snapshot information']),
      div({ style: { display: 'flex', flexWrap: 'wrap', margin: -4 } }, [
        h(DashboardInfoTile, { title: 'Creation date' }, [new Date(createDate).toLocaleDateString()]),
        h(DashboardInfoTile, { title: 'Public' }, [_.startCase(isPublic)])
      ]),
      h2({ style: Style.dashboard.header }, ['Owners']),
      _.map(email => {
        return div({ key: email, style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, [
          h(Link, { href: `mailto:${email}` }, [email])
        ])
      }, managers),
      div({ style: { margin: '1.5rem 0 1rem 0', borderBottom: `1px solid ${colors.dark(0.55)}` } }),
      h2({ style: { fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' } }, [
        'Import URL'
      ]),
      div({ style: { display: 'flex' } }, [
        div({ style: Style.noWrapEllipsis }, [importUrl]),
        h(Link, {
          style: { margin: '0 0.5rem', flexShrink: 0 },
          tooltip: 'Copy import URL',
          onClick: withErrorReporting('Error copying to clipboard', async () => {
            await clipboard.writeText(importUrl)
            setImportUrlCopied(true)
            setTimeout(() => setImportUrlCopied(), 1500)
          })
        }, [icon(importUrlCopied ? 'check' : 'copy-to-clipboard')])
      ])
    ])
  ])
}

const WorkflowWdl = () => {
  const { name, snapshotId, payload } = Utils.useStore(snapshotStore)

  return div({ style: { margin: '1rem 1.5rem 2rem', display: 'flex', flexDirection: 'column', flex: 1 }, role: 'tabpanel' }, [
    div({ style: { marginBottom: '1rem', alignSelf: 'flex-end' } }, [
      h(ButtonSecondary, {
        onClick: () => {
          const blob = new Blob([payload], { type: 'application/wdl' })
          FileSaver.saveAs(blob, `${name}.${snapshotId}.wdl`)
        }
      }, [icon('download', { style: { marginRight: '0.5rem' } }), 'Download .wdl'])
    ]),
    div({ style: { flex: 1 } }, [
      h(AutoSizer, [({ height, width }) => h(WDLViewer, { wdl: payload, style: { maxHeight: height, width } })])
    ])
  ])
}

const WorkflowConfigs = () => {
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

                return h(Link, { onClick: () => setDisplayingConfig(configs[rowIndex]) }, [`${namespace}/${name} Version: ${snapshotId}`])
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

const WorkflowDetails = props => {
  return h(WorkflowWrapper, props, [
    h(SnapshotWrapper, props, [
      Utils.switchCase(props.tabName,
        ['dashboard', () => h(WorkflowSummary)],
        ['wdl', () => h(WorkflowWdl)],
        ['configs', () => h(WorkflowConfigs)]
      )
    ])
  ])
}

export const navPaths = [
  {
    name: 'workflow-dashboard',
    path: '/workflows/:namespace/:name/:snapshotId?',
    component: props => h(WorkflowDetails, { ...props, tabName: 'dashboard' }),
    title: ({ name }) => `${name} - Dashboard`
  },
  {
    name: 'workflow-wdl',
    path: '/workflows/:namespace/:name/:snapshotId/wdl',
    component: props => h(WorkflowDetails, { ...props, tabName: 'wdl' }),
    title: ({ name }) => `${name} - WDL`
  },
  {
    name: 'workflow-configs',
    path: '/workflows/:namespace/:name/:snapshotId/configs',
    component: props => h(WorkflowDetails, { ...props, tabName: 'configs' }),
    title: ({ name }) => `${name} - Configurations`
  }
]
