import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { pageColumn } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import { centeredSpinner, icon, spinner } from 'src/components/icons'
import TopBar from 'src/components/TopBar'
import WDLViewer from 'src/components/WDLViewer'
import { WorkspaceImporter } from 'src/components/workspace-utils'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const mutabilityWarning = 'Please note: Dockstore cannot guarantee that the WDL and Docker image' +
  ' referenced by this Workflow will not change. We advise you to review the WDL before future' +
  ' runs.'
const wdlLoadError = 'Error loading WDL. Please verify the workflow path and version and ensure' +
  ' this workflow supports WDL.'

const DockstoreImporter = ajaxCaller(class DockstoreImporter extends Component {
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
  }

  loadWdl() {
    const { path, version, ajax: { Dockstore } } = this.props
    Dockstore.getWdl(path, version).then(
      ({ descriptor }) => this.setState({ wdl: descriptor }),
      failure => this.setState({ loadError: failure })
    )
  }

  renderImport() {
    const { importError, isImporting } = this.state
    return div({ style: { display: 'flex' } }, [
      pageColumn('Importing', 5, this.renderWdlArea()),
      pageColumn('Destination Workspace', 3,
        div({}, [
          h(WorkspaceImporter, { onImport: ws => this.import_(ws) }),
          isImporting && spinner({ style: { marginLeft: '0.5rem' } }),
          importError && div({
            style: { marginTop: '1rem', color: colors.red[0] }
          }, [
            icon('error'),
            JSON.parse(importError).message
          ])
        ])
      )
    ])
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
            margin: '1rem 0', color: colors.orange[0]
          }
        },
        [
          icon('warning-standard', { className: 'is-solid', size: 32, style: { marginRight: '0.5rem', flex: '0 0 auto' } }),
          mutabilityWarning
        ]),
        h(Collapse, { title: 'REVIEW WDL' },
          [h(WDLViewer, { wdl, style: { height: 'calc(100vh - 400px)', minHeight: 300 } })]
        )
      ]
    )
  }

  async import_({ namespace, name }) {
    this.setState({ isImporting: true })

    const { path, version, ajax: { Workspaces } } = this.props
    const toolName = _.last(path.split('/'))

    const rawlsWorkspace = Workspaces.workspace(namespace, name)

    const entityMetadata = await rawlsWorkspace.entityMetadata()

    rawlsWorkspace.importMethodConfigFromDocker({
      namespace, name: toolName, rootEntityType: _.head(_.keys(entityMetadata)),
      // the line of shame:
      inputs: {}, outputs: {}, prerequisites: {}, methodConfigVersion: 1, deleted: false,
      methodRepoMethod: {
        sourceRepo: 'dockstore',
        methodPath: path,
        methodVersion: version
      }
    }).then(() => Nav.goToPath('workflow', {
      namespace, name,
      workflowNamespace: namespace, workflowName: toolName
    }), importError => this.setState({ importError, isImporting: false }))
  }

  renderError() {
    const { loadError } = this.state

    return div({ style: { padding: '2rem' } }, [
      div(wdlLoadError),
      h(ErrorView, { error: loadError })
    ])
  }
})


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
    component: Importer,
    title: 'Import Tool'
  })
}
