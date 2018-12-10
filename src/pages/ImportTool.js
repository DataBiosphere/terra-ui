import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import TopBar from 'src/components/TopBar'
import WDLViewer from 'src/components/WDLViewer'
import { WorkspaceImporter } from 'src/components/workspace-utils'
import hexBackgroundPatternImport from 'src/images/hex-background-pattern-import.svg'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  container: {
    display: 'flex', alignItems: 'flex-start', flex: 'auto',
    backgroundImage: `url(${hexBackgroundPatternImport})`, backgroundRepeat: 'no-repeat',
    backgroundSize: '1800px', backgroundPosition: 'right -1200px top -75px',
    position: 'relative', padding: '2rem'
  },
  title: {
    fontSize: 24, fontWeight: 600, color: colors.darkBlue[0], marginBottom: '2rem'
  },
  card: {
    ...Style.elements.card, padding: '2rem', flex: 1, minWidth: 0
  }
}

const DockstoreImporter = ajaxCaller(class DockstoreImporter extends Component {
  componentDidMount() {
    this.loadWdl()
  }

  async loadWdl() {
    try {
      const { path, version, ajax: { Dockstore } } = this.props
      const { descriptor } = await Dockstore.getWdl(path, version)
      this.setState({ wdl: descriptor })
    } catch (error) {
      reportError('Error loading WDL', error)
    }
  }

  render() {
    const { path, version } = this.props
    const { isImporting, wdl } = this.state
    return div({ style: styles.container }, [
      div({ style: styles.card }, [
        div({ style: styles.title }, ['Importing from Dockstore']),
        div({ style: { fontSize: 18 } }, [path]),
        div({ style: { fontSize: 13, color: colors.gray[0] } }, [`V. ${version}`]),
        div({
          style: {
            display: 'flex', alignItems: 'center',
            margin: '1rem 0', color: colors.orange[0]
          }
        }, [
          icon('warning-standard', { className: 'is-solid', size: 32, style: { marginRight: '0.5rem', flex: 'none' } }),
          'Please note: Dockstore cannot guarantee that the WDL and Docker image referenced ',
          'by this Workflow will not change. We advise you to review the WDL before future runs.'
        ]),
        wdl && h(WDLViewer, { wdl, style: { height: 500 } })
      ]),
      div({ style: { ...styles.card, marginLeft: '2.5rem', maxWidth: 450, marginRight: '2.5rem' } }, [
        div({ style: styles.title }, ['Destination Workspace']),
        h(WorkspaceImporter, { onImport: ws => this.import_(ws) }),
        isImporting && spinnerOverlay
      ])
    ])
  }

  async import_({ namespace, name }) {
    try {
      this.setState({ isImporting: true })

      const { path, version, ajax: { Workspaces } } = this.props
      const workflowName = _.last(path.split('/'))
      const rawlsWorkspace = Workspaces.workspace(namespace, name)
      const entityMetadata = await rawlsWorkspace.entityMetadata()
      await rawlsWorkspace.importMethodConfigFromDocker({
        namespace, name: workflowName, rootEntityType: _.head(_.keys(entityMetadata)),
        inputs: {}, outputs: {}, prerequisites: {}, methodConfigVersion: 1, deleted: false,
        methodRepoMethod: {
          sourceRepo: 'dockstore',
          methodPath: path,
          methodVersion: version
        }
      })
      Nav.goToPath('workflow', { namespace, name, workflowNamespace: namespace, workflowName })
    } catch (error) {
      reportError('Error importing tool', error)
    } finally {
      this.setState({ isImporting: false })
    }
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
