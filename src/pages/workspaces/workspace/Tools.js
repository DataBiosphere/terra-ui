import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import * as breadcrumbs from 'src/components/breadcrumbs'
import togglesListView from 'src/components/CardsListToggle'
import {
  buttonOutline, buttonPrimary, Clickable, link, Markdown, MenuButton, menuIcon, methodLink, PageBox, spinnerOverlay
} from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { dockstoreTile, fcMethodRepoTile, makeToolCard } from 'src/pages/library/Code'
import DeleteToolModal from 'src/pages/workspaces/workspace/tools/DeleteToolModal'
import ExportToolModal from 'src/pages/workspaces/workspace/tools/ExportToolModal'
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
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  longCard: {
    width: '100%', minWidth: 0,
    marginBottom: '0.5rem'
  },
  longTitle: {
    ...Style.elements.card.title,
    whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1
  },
  longDescription: {
    flex: 1,
    paddingRight: '1rem',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  }
}

const ToolCard = pure(({ listView, name, namespace, config, onCopy, onDelete }) => {
  const { namespace: workflowNamespace, name: workflowName, methodRepoMethod: { sourceRepo, methodVersion }, isRedacted } = config
  const toolCardMenu = h(PopupTrigger, {
    closeOnClick: true,
    content: h(Fragment, [
      h(MenuButton, {
        onClick: () => onCopy(),
        disabled: isRedacted,
        tooltip: isRedacted ? 'This method is redacted' : undefined,
        tooltipSide: 'left'
      }, [menuIcon('copy'), 'Copy to Another Workspace']),
      h(MenuButton, {
        onClick: () => onDelete()
      }, [menuIcon('trash'), 'Delete'])
    ])
  }, [
    h(Clickable, {
      onClick: e => e.stopPropagation(),
      style: {
        cursor: 'pointer', color: colors.green[0], ...styles.innerLink
      },
      focus: 'hover',
      hover: { color: colors.green[2] }
    }, [
      icon('cardMenuIcon', {
        size: listView ? 18 : 24
      })
    ])
  ])
  const repoLink = link({
    href: methodLink(config),
    style: styles.innerLink,
    target: '_blank',
    disabled: isRedacted,
    onClick: e => e.stopPropagation()
  }, sourceRepo === 'agora' ? 'FireCloud' : sourceRepo)

  const workflowLink = a({
    href: Nav.getLink('workflow', { namespace, name, workflowNamespace, workflowName }),
    style: styles.outerLink
  })

  const redactedWarning = h(Clickable, {
    onClick: e => e.stopPropagation(),
    style: { color: colors.orange[0], ...styles.innerLink },
    tooltip: 'This method is redacted'
  }, [
    icon('warning', { size: 22 })
  ])

  return listView ?
    div({ style: { ...styles.card, ...styles.longCard } }, [
      isRedacted ? undefined: workflowLink,
      div({ style: { ...styles.innerContent, display: 'flex', alignItems: 'center' } }, [
        div({ style: { marginRight: '1rem' } }, [toolCardMenu]),
        div({ style: isRedacted ? { ...styles.longTitle, color: colors.gray[0] }: styles.longTitle }, [workflowName]),
        div({ style: { ...styles.longMethodVersion, display: 'flex', alignItems: 'center' } }, [`V. ${methodVersion}`, isRedacted ? redactedWarning : undefined]),
        div({ style: { flex: 'none', width: 130 } }, ['Source: ', repoLink])
      ])
    ]) :
    div({ style: { ...styles.card, ...styles.shortCard } }, [
      isRedacted ? undefined: workflowLink,
      div({ style: { ...styles.innerContent, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' } }, [
        div({ style: isRedacted ? { ...styles.shortTitle, color: colors.gray[0] }: styles.shortTitle }, [workflowName]),
        div({ style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } }, [
          div([
            div({ style: { display: 'flex', alignItems: 'center' } }, [
              `V. ${methodVersion}`,
              isRedacted ? redactedWarning : undefined
            ]),
            'Source: ', repoLink
          ]), toolCardMenu
        ])
      ])
    ])
})

const FindToolModal = ajaxCaller(class FindToolModal extends Component {
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
    const { selectedTool, featuredList, methods, selectedToolDetails, exporting } = this.state

    const featuredMethods = _.compact(_.map(
      ({ namespace, name }) => _.maxBy('snapshotId', _.filter({ namespace, name }, methods)),
      featuredList
    ))

    const { synopsis, managers, documentation } = selectedToolDetails || {}

    const renderDetails = () => [
      div({ style: { display: 'flex' } }, [
        div({ style: { flexGrow: 1 } }, [
          div({ style: { fontSize: 18, fontWeight: 600, margin: '1rem 0 0.5rem' } }, ['Synopsis']),
          div([synopsis || (selectedToolDetails && 'None')]),
          div({ style: { fontSize: 18, fontWeight: 600, margin: '1rem 0 0.5rem' } }, ['Method Owner']),
          div([_.join(',', managers)])
        ]),
        div({ style: { margin: '0 1rem', display: 'flex', flexDirection: 'column' } }, [
          buttonPrimary({ style: { marginBottom: '0.5rem' }, onClick: () => this.exportMethod() }, ['Add to Workspace']),
          buttonOutline({ onClick: () => this.setState({ selectedTool: undefined, selectedToolDetails: undefined }) }, ['Return to List'])
        ])
      ]),
      div({ style: { fontSize: 18, fontWeight: 600, margin: '1rem 0 0.5rem' } }, ['Documentation']),
      documentation && h(Markdown, { style: { maxHeight: 600, overflowY: 'auto' } }, [documentation]),
      (!selectedToolDetails || exporting) && spinnerOverlay
    ]

    const renderList = () => [
      div({ style: { display: 'flex', flexWrap: 'wrap', overflowY: 'auto', height: 400, paddingTop: 5, paddingLeft: 5 } }, [
        ...(featuredMethods ?
          _.map(method => makeToolCard({ method, onClick: () => this.loadMethod(method) }), featuredMethods) :
          [centeredSpinner()])
      ]),
      div({ style: { fontSize: 18, fontWeight: 600, marginTop: '1rem' } }, ['Find Additional Tools']),
      div({ style: { display: 'flex', padding: '0.5rem' } }, [
        div({ style: { flex: 1, marginRight: 10 } }, [dockstoreTile()]),
        div({ style: { flex: 1, marginLeft: 10 } }, [fcMethodRepoTile()])
      ])
    ]

    return h(Modal, {
      onDismiss,
      showButtons: false,
      title: selectedTool ? `Tool: ${selectedTool.name}` : 'Suggested Tools',
      showX: true,
      width: 900
    }, Utils.cond(
      [selectedTool, () => renderDetails()],
      () => renderList()
    ))
  }

  async loadMethod(selectedTool) {
    const { ajax: { Methods } } = this.props
    const { namespace, name, snapshotId } = selectedTool

    this.setState({ selectedTool })
    try {
      const selectedToolDetails = await Methods.method(namespace, name, snapshotId).get()
      this.setState({ selectedToolDetails })
    } catch (error) {
      reportError('Error loading tool', error)
      this.setState({ selectedTool: undefined })
    }
  }

  async exportMethod() {
    const { namespace, name, ajax: { Methods } } = this.props
    const { selectedTool } = this.state

    this.setState({ exporting: true })

    try {
      const methodAjax = Methods.method(selectedTool.namespace, selectedTool.name, selectedTool.snapshotId)

      const config = _.maxBy('snapshotId', await methodAjax.configs())

      await methodAjax.toWorkspace({ namespace, name }, config)

      Nav.goToPath('workflow', { namespace, name, workflowNamespace: selectedTool.namespace, workflowName: selectedTool.name })
    } catch (error) {
      reportError('Error importing tool', error)
      this.setState({ exporting: false })
    }
  }
})

export const Tools = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Tools', activeTab: 'tools'
  }),
  togglesListView('toolsTab'),
  ajaxCaller
)(class Tools extends Component {
  constructor(props) {
    super(props)
    this.state = StateHistory.get()
  }

  async refresh() {
    const { namespace, name, ajax: { Workspaces, Methods } } = this.props

    try {
      this.setState({ loading: true })
      const configs = await Workspaces.workspace(namespace, name).listMethodConfigs()
      const methods = await Methods.list()
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

  addRedactedAttribute(config, methods) {
    const { methodName, methodNamespace, methodVersion, sourceRepo } = config.methodRepoMethod
    const snapshotObjects = _.map(m => _.pick('snapshotId', m), _.filter({
      name: methodName,
      namespace: methodNamespace
    }, methods))
    const snapshots = _.map(m => { return m.snapshotId }, snapshotObjects)
    const isRedacted = !_.includes(methodVersion, snapshots)
    if (!sourceRepo) reportError('Caller must specify source repo for method')
    else config.isRedacted = isRedacted
  }

  render() {
    const { namespace, name, listView, viewToggleButtons, workspace: { workspace } } = this.props
    const { loading, configs, copyingTool, deletingTool, findingTool, methods } = this.state

    const tools = _.map(config => {
      this.addRedactedAttribute(config, methods)
      return h(ToolCard, {
        onCopy: () => this.setState({ copyingTool: { namespace: config.namespace, name: config.name } }),
        onDelete: () => this.setState({ deletingTool: { namespace: config.namespace, name: config.name } }),
        key: `${config.namespace}/${config.name}`, namespace, name, config, listView
      })
    }, configs)

    return h(PageBox, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Tools']),
        viewToggleButtons,
        copyingTool && h(ExportToolModal, {
          thisWorkspace: workspace, methodConfig: this.getConfig(copyingTool),
          onDismiss: () => this.setState({ copyingTool: undefined })
        }),
        deletingTool && h(DeleteToolModal, {
          workspace, methodConfig: this.getConfig(deletingTool),
          onDismiss: () => this.setState({ deletingTool: undefined }),
          onSuccess: () => {
            this.refresh()
            this.setState({ deletingTool: undefined })
          }
        })
      ]),
      div({ style: styles.cardContainer(listView) }, [
        h(Clickable, {
          style: { ...styles.card, ...styles.shortCard, color: colors.green[0], fontSize: 18, lineHeight: '22px' },
          onClick: () => this.setState({ findingTool: true })
        }, [
          'Find a Tool',
          icon('plus-circle', { size: 32 })
        ]),
        listView ? div({ style: { flex: 1 } }, [tools]) : tools,
        findingTool && h(FindToolModal, {
          namespace, name,
          onDismiss: () => this.setState({ findingTool: false })
        }),
        loading && spinnerOverlay
      ])
    ])
  }

  async componentDidMount() {
    this.refresh()
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(['configs'], this.state))
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspace-tools', {
    path: '/workspaces/:namespace/:name/tools',
    component: Tools,
    title: ({ name }) => `${name} - Tools`
  })
}
