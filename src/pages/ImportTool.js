import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { buttonPrimary, pageColumn } from 'src/components/common'
import { centeredSpinner, icon, spinner } from 'src/components/icons'
import { TopBar } from 'src/components/TopBar'
import WDLViewer from 'src/components/WDLViewer'
import { Dockstore, Rawls } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component, Select } from 'src/libs/wrapped-components'


export class DestinationProject extends Component {
  render() {
    const { import_, isImporting, onWorkspaceSelected, selectedWorkspace } = this.props
    const { workspaces, importError } = this.state

    return div({},
      [
        h(Select, {
          clearable: false,
          searchable: true,
          disabled: !workspaces,
          placeholder: workspaces ? 'Select a workspace' : 'Loading workspaces...',
          value: selectedWorkspace,
          onChange: selectedWorkspace => onWorkspaceSelected(selectedWorkspace),
          options: _.map(({ workspace }) => {
            return { value: workspace, label: workspace.name }
          }, workspaces)
        }),
        buttonPrimary(
          {
            style: { marginTop: '1rem' },
            disabled: !selectedWorkspace || isImporting,
            onClick: async () => {
              try {
                this.setState({ importError: null })
                await import_()
              } catch (importError) {
                this.setState({ importError })
              }
            }
          },
          'Import'),
        isImporting && spinner({ style: { marginLeft: '0.5rem' } }),
        importError && div({
          style: { marginTop: '1rem', color: Style.colors.error }
        }, [
          icon('error'),
          JSON.parse(importError).message
        ])
      ]
    )
  }

  componentDidMount() {
    Rawls.workspacesList().then(workspaces => this.setState({ workspaces }))
  }
}

const mutabilityWarning = 'Please note: Dockstore cannot guarantee that the WDL and Docker image' +
  ' referenced by this Workflow will not change. We advise you to review the WDL before future' +
  ' runs.'
const wdlLoadError = 'Error loading WDL. Please verify the workflow path and version and ensure' +
  ' this workflow supports WDL.'

class DockstoreImporter extends Component {
  render() {
    const { wdl, loadError } = this.state

    return Utils.cond(
      [wdl, () => this.renderImport()],
      [loadError, () => this.renderError()],
      centeredSpinner
    )
  }

  componentDidMount() {
    this.loadWdl()
    Rawls.workspacesList().then(workspaces => this.setState({ workspaces }))
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.path !== this.props.path || nextProps.version !== this.props.version) {
      this.setState({ wdl: undefined, loadError: undefined }, () => this.loadWdl())
    }
  }

  loadWdl() {
    const { path, version } = this.props
    Dockstore.getWdl(path, version).then(
      ({ descriptor }) => this.setState({ wdl: descriptor }),
      failure => this.setState({ loadError: failure })
    )
  }

  renderImport() {
    const { selectedWorkspace } = this.state
    return div({ style: { display: 'flex' } },
      [
        pageColumn('Importing', 5, this.renderWdlArea()),
        pageColumn('Destination Project', 3,
          h(DestinationProject, {
            selectedWorkspace,
            onWorkspaceSelected: selectedWorkspace => this.setState({ selectedWorkspace }),
            import_: () => this.import_()
          }))
      ]
    )
  }

  renderWdlArea() {
    const { path, version } = this.props
    const { wdl } = this.state

    return div(
      {
        style: {
          borderRadius: 5, backgroundColor: 'white', padding: '1rem',
          boxShadow: `0 0 2px 0 rgba(0,0,0,0.12), ${Style.standardShadow}`
        }
      },
      [
        div({ style: { fontSize: 16 } }, `From Dockstore - ${path}`),
        div({}, `V. ${version}`),
        div({
          style: {
            display: 'flex', alignItems: 'center',
            margin: '1rem 0', color: Style.colors.warning
          }
        },
        [
          icon('warning-standard', { class: 'is-solid', size: 32, style: { marginRight: '0.5rem', flex: '0 0 auto' } }),
          mutabilityWarning
        ]),
        h(Collapse, { title: 'REVIEW WDL' },
          [h(WDLViewer, { wdl, style: { height: 'calc(100vh - 400px)', minHeight: 300 } })]
        )
      ]
    )
  }

  async import_() {
    const { selectedWorkspace: { value: { namespace, name } } } = this.state
    const { path, version } = this.props
    const toolName = _.last(path.split('/'))

    const rawlsWorkspace = Rawls.workspace(namespace, name)

    const entities = await rawlsWorkspace.entities()

    rawlsWorkspace.importMethodConfigFromDocker({
      namespace, name: toolName, rootEntityType: _.head(_.keys(entities)),
      // the line of shame:
      inputs: {}, outputs: {}, prerequisites: {}, methodConfigVersion: 1, deleted: false,
      methodRepoMethod: {
        sourceRepo: 'dockstore',
        methodPath: path,
        methodVersion: version
      }
    }).then(() => Nav.goToPath('workflow', {
      workspaceNamespace: namespace, workspaceName: name,
      workflowNamespace: namespace, workflowName: toolName
    }))
  }

  renderError() {
    const { loadError } = this.state

    return h(Fragment, [
      div(wdlLoadError),
      div(`Error: ${loadError}`)
    ])
  }
}


class Importer extends Component {
  render() {
    const { source } = this.props

    return h(Fragment, [
      h(TopBar, { title: 'Import Tool' }),
      Utils.cond(
        [source === 'dockstore', () => this.renderDockstore()],
        () => `Unknown source '${source}'`
      )
    ])
  }

  renderDockstore() {
    const { item } = this.props
    const [path, version] = item.split(':')
    return h(DockstoreImporter, { path, version })
  }
}


export const addNavPaths = () => {
  Nav.defPath('import-tool', {
    path: '/import-tool/:source/:item*',
    component: Importer
  })
}
