import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { a, div, h, label, span } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import * as breadcrumbs from 'src/components/breadcrumbs'
import togglesListView from 'src/components/CardsListToggle'
import {
  ButtonOutline, ButtonPrimary, Clickable, IdContainer, Link, makeMenuIcon, MenuButton, methodLink, PageBox, Select, spinnerOverlay
} from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { Markdown } from 'src/components/Markdown'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { dockstoreTile, fcMethodRepoTile, makeWorkflowCard } from 'src/pages/library/Code'
import DeleteWorkflowModal from 'src/pages/workspaces/workspace/workflows/DeleteWorkflowModal'
import ExportWorkflowModal from 'src/pages/workspaces/workspace/workflows/ExportWorkflowModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  cardContainer: listView => ({
    display: 'flex', flexWrap: 'wrap',
    marginRight: listView ? undefined : '-1rem'
  }),
  // Card's position: relative and the outer/inner styles are a little hack to fake nested links
  card: {
    ...Style.elements.card.container, position: 'relative'
  },
  outerLink: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0
  },
  innerContent: {
    position: 'relative', pointerEvents: 'none'
  },
  innerLink: {
    pointerEvents: 'auto'
  },
  // (end link hacks)
  shortCard: {
    width: 300, height: 125, margin: '0 1rem 2rem 0'
  },
  shortTitle: {
    ...Style.elements.card.title,
    flex: 1,
    lineHeight: '20px', height: '40px',
    overflowWrap: 'break-word'
  },
  shortDescription: {
    flex: 'none',
    lineHeight: '18px', height: '90px',
    overflow: 'hidden'
  },
  longMethodVersion: {
    marginRight: '1rem', width: 90,
    ...Style.noWrapEllipsis
  },
  longCard: {
    width: '100%', minWidth: 0,
    marginBottom: '0.5rem'
  },
  longTitle: {
    ...Style.elements.card.title,
    ...Style.noWrapEllipsis, flex: 1
  },
  longDescription: {
    flex: 1,
    paddingRight: '1rem',
    ...Style.noWrapEllipsis
  }
}

const sortTokens = {
  lowerCaseName: config => config.name.toLowerCase()
}
const defaultSort = { label: 'Alphabetical', value: { field: 'lowerCaseName', direction: 'asc' } }
const sortOptions = [
  defaultSort,
  { label: 'Reverse Alphabetical', value: { field: 'lowerCaseName', direction: 'desc' } }
]

const WorkflowCard = pure(({ listView, name, namespace, config, onExport, onCopy, onDelete, isRedacted, workspace }) => {
  const { namespace: workflowNamespace, name: workflowName, methodRepoMethod: { sourceRepo, methodVersion } } = config
  const workflowCardMenu = h(PopupTrigger, {
    closeOnClick: true,
    content: h(Fragment, [
      h(MenuButton, {
        onClick: onExport,
        disabled: isRedacted,
        tooltip: isRedacted ? 'This workflow version is redacted' : undefined,
        tooltipSide: 'left'
      }, [makeMenuIcon('export'), 'Copy to Another Workspace']),
      h(MenuButton, {
        onClick: onCopy,
        disabled: !!Utils.editWorkspaceError(workspace),
        tooltip: Utils.editWorkspaceError(workspace),
        tooltipSide: 'left'
      }, [makeMenuIcon('copy'), 'Duplicate']),
      h(MenuButton, {
        onClick: onDelete,
        disabled: !!Utils.editWorkspaceError(workspace),
        tooltip: Utils.editWorkspaceError(workspace),
        tooltipSide: 'left'
      }, [makeMenuIcon('trash'), 'Delete'])
    ])
  }, [
    h(Link, { 'aria-label': 'Workflow menu', onClick: e => e.stopPropagation(), style: styles.innerLink }, [
      icon('cardMenuIcon', {
        size: listView ? 18 : 24
      })
    ])
  ])
  const repoLink = h(Link, {
    href: methodLink(config),
    style: styles.innerLink,
    ...Utils.newTabLinkProps,
    disabled: isRedacted
  }, sourceRepo === 'agora' ? 'Terra' : sourceRepo)

  const workflowLink = a({
    'aria-label': workflowName,
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName }),
    style: styles.outerLink
  })

  const redactedWarning = h(TooltipTrigger, {
    content: 'Workflow version has been removed. You cannot run an analysis until you change the version.'
  }, [icon('ban', { size: 20, style: { color: colors.warning(), marginLeft: '.3rem', ...styles.innerLink } })])

  return listView ?
    div({ style: { ...styles.card, ...styles.longCard } }, [
      workflowLink,
      div({ style: { ...styles.innerContent, display: 'flex', alignItems: 'center' } }, [
        div({ style: { marginRight: '1rem' } }, [workflowCardMenu]),
        div({ style: { ...styles.longTitle } }, [workflowName]),
        div({ style: { ...styles.longMethodVersion, display: 'flex', alignItems: 'center' } }, [
          `V. ${methodVersion}`,
          isRedacted && redactedWarning
        ]),
        div({ style: { flex: 'none', width: 130 } }, ['Source: ', repoLink])
      ])
    ]) :
    div({ style: { ...styles.card, ...styles.shortCard } }, [
      workflowLink,
      div({ style: { ...styles.innerContent, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' } }, [
        div({ style: { ...styles.shortTitle } }, [workflowName]),
        div({ style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } }, [
          div([
            div({ style: { display: 'flex', alignItems: 'center' } }, [
              `V. ${methodVersion}`,
              isRedacted && redactedWarning
            ]),
            'Source: ', repoLink
          ]), workflowCardMenu
        ])
      ])
    ])
})

const FindWorkflowModal = ajaxCaller(class FindWorkflowModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedWorkflow: undefined,
      featuredList: undefined,
      methods: undefined,
      selectedWorkflowDetails: undefined,
      exporting: undefined
    }
  }

  async componentDidMount() {
    const { ajax: { Methods } } = this.props

    const [featuredList, methods] = await Promise.all([
      fetch(`${getConfig().firecloudBucketRoot}/featured-methods.json`).then(res => res.json()),
      Methods.list({ namespace: 'gatk' })
    ])

    this.setState({ featuredList, methods })
  }

  render() {
    const { onDismiss } = this.props
    const { selectedWorkflow, featuredList, methods, selectedWorkflowDetails, exporting } = this.state

    const featuredMethods = _.compact(_.map(
      ({ namespace, name }) => _.maxBy('snapshotId', _.filter({ namespace, name }, methods)),
      featuredList
    ))

    const { synopsis, managers, documentation } = selectedWorkflowDetails || {}

    const renderDetails = () => [
      div({ style: { display: 'flex' } }, [
        div({ style: { flexGrow: 1 } }, [
          div({ style: { fontSize: 18, fontWeight: 600, margin: '1rem 0 0.5rem' } }, ['Synopsis']),
          div([synopsis || (selectedWorkflowDetails && 'None')]),
          div({ style: { fontSize: 18, fontWeight: 600, margin: '1rem 0 0.5rem' } }, ['Method Owner']),
          div([_.join(',', managers)])
        ]),
        div({ style: { margin: '0 1rem', display: 'flex', flexDirection: 'column' } }, [
          h(ButtonPrimary, { style: { marginBottom: '0.5rem' }, onClick: () => this.exportMethod() }, ['Add to Workspace']),
          h(ButtonOutline, { onClick: () => this.setState({ selectedWorkflow: undefined, selectedWorkflowDetails: undefined }) }, ['Return to List'])
        ])
      ]),
      div({ style: { fontSize: 18, fontWeight: 600, margin: '1rem 0 0.5rem' } }, ['Documentation']),
      documentation && h(Markdown, { style: { maxHeight: 600, overflowY: 'auto' } }, [documentation]),
      (!selectedWorkflowDetails || exporting) && spinnerOverlay
    ]

    const renderList = () => [
      div({ style: { display: 'flex', flexWrap: 'wrap', overflowY: 'auto', height: 400, paddingTop: 5, paddingLeft: 5 } }, [
        ...(featuredMethods ?
          _.map(method => makeWorkflowCard({ method, onClick: () => this.loadMethod(method) }), featuredMethods) :
          [centeredSpinner()])
      ]),
      div({ style: { fontSize: 18, fontWeight: 600, marginTop: '1rem' } }, ['Find Additional Workflows']),
      div({ style: { display: 'flex', padding: '0.5rem' } }, [
        div({ style: { flex: 1, marginRight: 10 } }, [dockstoreTile()]),
        div({ style: { flex: 1, marginLeft: 10 } }, [fcMethodRepoTile()])
      ])
    ]

    return h(Modal, {
      onDismiss,
      showButtons: false,
      title: selectedWorkflow ? `Workflow: ${selectedWorkflow.name}` : 'Suggested Workflows',
      showX: true,
      width: 900
    }, Utils.cond(
      [selectedWorkflow, () => renderDetails()],
      () => renderList()
    ))
  }

  async loadMethod(selectedWorkflow) {
    const { ajax: { Methods } } = this.props
    const { namespace, name, snapshotId } = selectedWorkflow

    this.setState({ selectedWorkflow })
    try {
      const selectedWorkflowDetails = await Methods.method(namespace, name, snapshotId).get()
      this.setState({ selectedWorkflowDetails })
    } catch (error) {
      reportError('Error loading workflow', error)
      this.setState({ selectedWorkflow: undefined })
    }
  }

  async exportMethod() {
    const { namespace, name } = this.props
    const { selectedWorkflow } = this.state

    this.setState({ exporting: true })

    try {
      const methodAjax = Ajax().Methods.method(selectedWorkflow.namespace, selectedWorkflow.name, selectedWorkflow.snapshotId)

      const config = _.maxBy('snapshotId', await methodAjax.configs())

      await methodAjax.toWorkspace({ namespace, name }, config)

      Nav.goToPath('workflow', { namespace, name, workflowNamespace: selectedWorkflow.namespace, workflowName: selectedWorkflow.name })
    } catch (error) {
      reportError('Error importing workflow', error)
      this.setState({ exporting: false })
    }
  }
})

const noWorkflowsMessage = div({ style: { fontSize: 20, margin: '1rem' } }, [
  div([
    'To get started, click ', span({ style: { fontWeight: 600 } }, ['Find a Workflow'])
  ]),
  div({ style: { marginTop: '1rem', fontSize: 16 } }, [
    h(Link, {
      ...Utils.newTabLinkProps,
      href: `https://support.terra.bio/hc/en-us/sections/360004147011`
    }, [`What's a workflow?`])
  ])
])

export const Workflows = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Workflows', activeTab: 'workflows'
  }),
  togglesListView('workflowsTab'),
  ajaxCaller
)(class Workflows extends Component {
  constructor(props) {
    super(props)
    this.state = {
      sortOrder: defaultSort.value,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { namespace, name, ajax: { Workspaces, Methods } } = this.props

    try {
      this.setState({ loading: true })
      const [configs, methods] = await Promise.all([
        Workspaces.workspace(namespace, name).listMethodConfigs(),
        Methods.list()
      ])
      this.setState({ configs, methods })
    } catch (error) {
      reportError('Error loading configs', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  getConfig({ namespace, name }) {
    const { configs } = this.state
    return _.find({ namespace, name }, configs)
  }

  computeRedacted(config) {
    const { methods } = this.state
    const { methodName, methodNamespace, methodVersion, sourceRepo } = config.methodRepoMethod
    return (sourceRepo === 'agora') ? !_.some({ name: methodName, namespace: methodNamespace, snapshotId: methodVersion }, methods) : false
  }

  render() {
    const { namespace, name, listView, viewToggleButtons, workspace: ws, workspace: { workspace } } = this.props
    const { loading, configs, exportingWorkflow, copyingWorkflow, deletingWorkflow, findingWorkflow, sortOrder, sortOrder: { field, direction } } = this.state
    const workflows = _.flow(
      _.orderBy(sortTokens[field] || field, direction),
      _.map(config => {
        const isRedacted = this.computeRedacted(config)
        return h(WorkflowCard, {
          onExport: () => this.setState({ exportingWorkflow: { namespace: config.namespace, name: config.name } }),
          onCopy: () => this.setState({ copyingWorkflow: { namespace: config.namespace, name: config.name } }),
          onDelete: () => this.setState({ deletingWorkflow: { namespace: config.namespace, name: config.name } }),
          key: `${config.namespace}/${config.name}`, namespace, name, config, listView, isRedacted, workspace: ws
        })
      })
    )(configs)

    return h(PageBox, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Workflows']),
        h(IdContainer, [id => h(Fragment, [
          label({ htmlFor: id, style: { marginLeft: 'auto', marginRight: '0.75rem' } }, ['Sort By:']),
          h(Select, {
            id,
            value: sortOrder,
            isClearable: false,
            styles: { container: old => ({ ...old, width: 220, marginRight: '1.10rem' }) },
            options: sortOptions,
            onChange: selected => this.setState({ sortOrder: selected.value })
          })
        ])]),
        viewToggleButtons,
        exportingWorkflow && h(ExportWorkflowModal, {
          thisWorkspace: workspace, methodConfig: this.getConfig(exportingWorkflow),
          onDismiss: () => this.setState({ exportingWorkflow: undefined })
        }),
        copyingWorkflow && h(ExportWorkflowModal, {
          thisWorkspace: workspace, methodConfig: this.getConfig(copyingWorkflow),
          sameWorkspace: true,
          onDismiss: () => this.setState({ copyingWorkflow: undefined }),
          onSuccess: () => {
            this.refresh()
            this.setState({ copyingWorkflow: undefined })
          }
        }),
        deletingWorkflow && h(DeleteWorkflowModal, {
          workspace, methodConfig: this.getConfig(deletingWorkflow),
          onDismiss: () => this.setState({ deletingWorkflow: undefined }),
          onSuccess: () => {
            this.refresh()
            this.setState({ deletingWorkflow: undefined })
          }
        })
      ]),
      div({ style: styles.cardContainer(listView) }, [
        h(Clickable, {
          disabled: !!Utils.editWorkspaceError(ws),
          tooltip: Utils.editWorkspaceError(ws),
          style: { ...styles.card, ...styles.shortCard, color: colors.accent(), fontSize: 18, lineHeight: '22px' },
          onClick: () => this.setState({ findingWorkflow: true })
        }, [
          'Find a Workflow',
          icon('plus-circle', { size: 32 })
        ]),
        !loading && _.isEmpty(workflows) && noWorkflowsMessage,
        listView ? div({ style: { flex: 1 } }, [workflows]) : workflows,
        findingWorkflow && h(FindWorkflowModal, {
          namespace, name,
          onDismiss: () => this.setState({ findingWorkflow: false })
        }),
        loading && spinnerOverlay
      ])
    ])
  }

  componentDidMount() {
    this.refresh()
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(['configs', 'sortOrder'], this.state))
  }
})

export const navPaths = [
  {
    name: 'workspace-workflows',
    path: '/workspaces/:namespace/:name/workflows',
    component: Workflows,
    title: ({ name }) => `${name} - Workflows`
  }, {
    name: 'workspace-tools', // legacy
    path: '/workspaces/:namespace/:name/tools',
    component: props => h(Nav.Redirector, { pathname: Nav.getPath('workspace-workflows', props) })
  }
]
