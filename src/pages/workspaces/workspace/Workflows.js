import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { a, div, h, label, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { ViewToggleButtons, withViewToggle } from 'src/components/CardsListToggle'
import {
  ButtonOutline, ButtonPrimary, ButtonSecondary, Clickable, IdContainer, Link, makeMenuIcon, MenuButton, methodLink, PageBox, Select, spinnerOverlay
} from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { DelayedSearchInput, ValidatedInput } from 'src/components/input'
import { MarkdownViewer } from 'src/components/markdown'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { reportError } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { DockstoreTile, MethodCard, MethodRepoTile } from 'src/pages/library/Code'
import DeleteWorkflowModal from 'src/pages/workspaces/workspace/workflows/DeleteWorkflowModal'
import ExportWorkflowModal from 'src/pages/workspaces/workspace/workflows/ExportWorkflowModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import validate from 'validate.js'


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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: '1rem 0 0.5rem'
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

const WorkflowCard = Utils.memoWithName('WorkflowCard', ({ listView, name, namespace, config, onExport, onCopy, onDelete, workspace }) => {
  const { namespace: workflowNamespace, name: workflowName, methodRepoMethod: { sourceRepo, methodVersion } } = config
  const workflowCardMenu = h(PopupTrigger, {
    closeOnClick: true,
    content: h(Fragment, [
      h(MenuButton, {
        onClick: onExport,
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
    ...Utils.newTabLinkProps
  }, sourceRepo === 'agora' ? 'Terra' : sourceRepo)

  const workflowLink = a({
    'aria-label': workflowName,
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName }),
    style: styles.outerLink
  })

  return listView ?
    div({ style: { ...styles.card, ...styles.longCard } }, [
      workflowLink,
      div({ style: { ...styles.innerContent, display: 'flex', alignItems: 'center' } }, [
        div({ style: { marginRight: '1rem' } }, [workflowCardMenu]),
        div({ style: { ...styles.longTitle } }, [workflowName]),
        div({ style: { ...styles.longMethodVersion, display: 'flex', alignItems: 'center' } }, [
          `V. ${methodVersion}`
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
              `V. ${methodVersion}`
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
      exporting: undefined,
      workflowRename: '',
      isEditingName: false
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
    const { selectedWorkflow, featuredList, methods, selectedWorkflowDetails, exporting, workflowRename, isEditingName } = this.state

    const featuredMethods = _.compact(_.map(
      ({ namespace, name }) => _.maxBy('snapshotId', _.filter({ namespace, name }, methods)),
      featuredList
    ))

    const { synopsis, managers, documentation } = selectedWorkflowDetails || {}

    const errors = validate({ workflowRename }, {
      workflowRename: {
        presence: { allowEmpty: false },
        format: {
          pattern: /^[A-Za-z0-9_\-.]*$/,
          message: 'can only contain letters, numbers, underscores, dashes, and periods'
        }
      }
    })

    const renderDetails = () => [
      div({ style: { display: 'flex' } }, [
        div({ style: { flexGrow: 1, marginTop: '1rem' } }, [
          !isEditingName ?
            h(Fragment, [span({ style: styles.sectionTitle }, ['Workflow Name: ']), `${workflowRename}`,
              h(Link, {
                style: { marginRight: '0.5rem' },
                onClick: () => this.setState({ isEditingName: !isEditingName }),
                'aria-label': 'Edit workflow name'
              }, [icon('edit', { style: { marginLeft: '0.5rem' }, size: 13 })])])
            :
            h(Fragment, [
              h(IdContainer, [id => h(Fragment, [
                h(FormLabel, { htmlFor: id, style: { margin: '0 0 0.25rem' } }, ['Workflow Name:']),
                h(ValidatedInput, {
                  error: Utils.summarizeErrors(errors && errors.workflowRename),
                  inputProps: {
                    id,
                    value: workflowRename,
                    onChange: workflowRename => { this.setState({ workflowRename }) }
                  }
                })
              ])]),
              div({ style: { marginTop: '0.5rem' } }, [
                h(ButtonPrimary, {
                  style: { marginRight: '0.5rem' },
                  disabled: !!errors,
                  onClick: () => this.setState({ isEditingName: !isEditingName })
                }, ['save']),
                h(ButtonSecondary, {
                  onClick: () => this.setState({ isEditingName: !isEditingName, workflowRename: selectedWorkflow.name })
                }, ['cancel'])
              ])
            ]),
          div({ style: styles.sectionTitle }, ['Synopsis']),
          div([synopsis || (selectedWorkflowDetails && 'None')]),
          div({ style: styles.sectionTitle }, ['Method Owner']),
          div([_.join(',', managers)])
        ]),
        div({ style: { margin: '0 1rem', display: 'flex', flexDirection: 'column' } }, [
          h(ButtonPrimary, {
            disabled: !!errors || !!isEditingName,
            tooltip: Utils.summarizeErrors(errors),
            style: { marginBottom: '0.5rem' }, onClick: () => this.exportMethod()
          }, ['Add to Workspace']),
          h(ButtonOutline, {
            onClick: () => this.setState(
              { selectedWorkflow: undefined, selectedWorkflowDetails: undefined, isEditingName: false, workflowRename: undefined })
          }, ['Return to List'])
        ])
      ]),
      div({ style: styles.sectionTitle }, ['Documentation']),
      documentation && h(MarkdownViewer, { style: { maxHeight: 600, overflowY: 'auto' } }, [documentation]),
      (!selectedWorkflowDetails || exporting) && spinnerOverlay
    ]

    const renderList = () => [
      div({ style: { display: 'flex', flexWrap: 'wrap', overflowY: 'auto', height: 400, paddingTop: 5, paddingLeft: 5 } }, [
        ...(featuredMethods ?
          _.map(method => h(MethodCard, { method, onClick: () => this.loadMethod(method) }), featuredMethods) :
          [centeredSpinner()])
      ]),
      div({ style: { fontSize: 18, fontWeight: 600, marginTop: '1rem' } }, ['Find Additional Workflows']),
      div({ style: { display: 'flex', padding: '0.5rem' } }, [
        div({ style: { flex: 1, marginRight: 10 } }, [h(DockstoreTile)]),
        div({ style: { flex: 1, marginLeft: 10 } }, [h(MethodRepoTile)])
      ])
    ]

    return h(Modal, {
      onDismiss,
      showButtons: false,
      title: selectedWorkflow ? 'Import Selected Workflow to Workspace' : 'Suggested Workflows',
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

    this.setState({ selectedWorkflow, workflowRename: selectedWorkflow.name })
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
    const { selectedWorkflow, workflowRename } = this.state

    this.setState({ exporting: true })

    try {
      const methodAjax = Ajax().Methods.method(selectedWorkflow.namespace, selectedWorkflow.name, selectedWorkflow.snapshotId)

      const config = _.maxBy('snapshotId', await methodAjax.configs())

      if (config && workflowRename !== selectedWorkflow.name) {
        config.name = workflowRename
        config.payloadObject.name = workflowRename
      }

      await methodAjax.toWorkspace({ namespace, name }, config, workflowRename !== selectedWorkflow.name ? workflowRename : undefined)

      const { namespace: workflowNamespace, name: workflowName } = config || selectedWorkflow

      Nav.goToPath('workflow', { namespace, name, workflowNamespace, workflowName: config ? workflowName : workflowRename })
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
  withViewToggle('workflowsTab'),
  ajaxCaller
)(class Workflows extends Component {
  constructor(props) {
    super(props)
    this.state = {
      sortOrder: defaultSort.value,
      filter: '',
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { namespace, name, ajax: { Workspaces } } = this.props

    try {
      this.setState({ loading: true })
      const configs = await Workspaces.workspace(namespace, name).listMethodConfigs()
      this.setState({ configs })
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

  render() {
    const { namespace, name, listView, setListView, workspace: ws, workspace: { workspace } } = this.props
    const { loading, configs, exportingWorkflow, copyingWorkflow, deletingWorkflow, findingWorkflow, sortOrder, sortOrder: { field, direction }, filter } = this.state
    const workflows = _.flow(
      _.filter(({ name }) => Utils.textMatch(filter, name)),
      _.orderBy(sortTokens[field] || field, direction),
      _.map(config => {
        return h(WorkflowCard, {
          onExport: () => this.setState({ exportingWorkflow: { namespace: config.namespace, name: config.name } }),
          onCopy: () => this.setState({ copyingWorkflow: { namespace: config.namespace, name: config.name } }),
          onDelete: () => this.setState({ deletingWorkflow: { namespace: config.namespace, name: config.name } }),
          key: `${config.namespace}/${config.name}`, namespace, name, config, listView, workspace: ws
        })
      })
    )(configs)

    return h(PageBox, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Workflows']),
        div({ style: { flexGrow: 1 } }),
        h(DelayedSearchInput, {
          'aria-label': 'Search workflows',
          style: { marginRight: '0.75rem', width: 220 },
          placeholder: 'SEARCH WORKFLOWS',
          onChange: v => this.setState({ filter: v }),
          value: filter
        }),
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
        h(ViewToggleButtons, { listView, setListView }),
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
        Utils.cond(
          [configs && _.isEmpty(configs), () => noWorkflowsMessage],
          [!_.isEmpty(configs) && _.isEmpty(workflows), () => {
            return div({ style: { fontStyle: 'italic' } }, ['No matching workflows'])
          }],
          [listView, () => div({ style: { flex: 1 } }, [workflows])],
          () => workflows
        ),
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
    StateHistory.update(_.pick(['configs', 'sortOrder', 'filter'], this.state))
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
