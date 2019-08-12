import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import TopBar from 'src/components/TopBar'
import WDLViewer from 'src/components/WDLViewer'
import { WorkspaceImporter } from 'src/components/workspace-utils'
import importBackground from 'src/images/hex-import-background.svg'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  container: {
    display: 'flex', alignItems: 'flex-start', flex: 'auto',
    backgroundImage: `url(${importBackground})`, backgroundRepeat: 'no-repeat',
    backgroundSize: '1825px', backgroundPosition: 'left 745px top -90px',
    position: 'relative', padding: '2rem'
  },
  title: {
    fontSize: 24, fontWeight: 600, color: colors.dark(), marginBottom: '2rem'
  },
  card: {
    ...Style.elements.card.container, borderRadius: 8, padding: '2rem', flex: 1, minWidth: 0,
    boxShadow: '0 1px 5px 0 rgba(0,0,0,0.26), 0 2px 10px 0 rgba(0,0,0,0.16)'
  }
}

const DockstoreImporter = ajaxCaller(class DockstoreImporter extends Component {
  constructor(props) {
    super(props)
    this.state = { isImporting: false, wdl: undefined }
  }

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
      div({ style: { ...styles.card, maxWidth: 740 } }, [
        div({ style: styles.title }, ['Importing from Dockstore']),
        div({ style: { fontSize: 18 } }, [path]),
        div({ style: { fontSize: 13, color: colors.dark() } }, [`V. ${version}`]),
        div({
          style: {
            display: 'flex', alignItems: 'center',
            margin: '1rem 0', color: colors.warning()
          }
        }, [
          icon('warning-standard', { size: 32, style: { marginRight: '0.5rem', flex: 'none' } }),
          'Please note: Dockstore cannot guarantee that the WDL and Docker image referenced ',
          'by this Workflow will not change. We advise you to review the WDL before future runs.'
        ]),
        wdl && h(WDLViewer, { wdl, style: { height: 500 } })
      ]),
      div({ style: { ...styles.card, margin: '0 2.5rem', maxWidth: 430 } }, [
        div({ style: styles.title }, ['Destination Workspace']),
        h(WorkspaceImporter, { onImport: ws => this.import_(ws) }),
        isImporting && spinnerOverlay
      ])
    ])
  }

  async import_({ namespace, name }) {
    try {
      this.setState({ isImporting: true })

      const { path, version } = this.props
      const workflowName = _.last(path.split('/'))
      const rawlsWorkspace = Ajax().Workspaces.workspace(namespace, name)
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
      reportError('Error importing workflow', error)
    } finally {
      this.setState({ isImporting: false })
    }
  }
})


const Importer = ({ source, item }) => {
  const [path, version] = item.split(':')

  return h(Fragment, [
    h(TopBar, { title: 'Import Workflow' }),
    div({ role: 'main' }, [
      Utils.cond(
        [source === 'dockstore', () => h(DockstoreImporter, { path, version })],
        () => `Unknown source '${source}'`
      )
    ])
  ])
}


export const navPaths = [
  {
    name: 'import-workflow',
    path: '/import-workflow/:source/:item(.*)',
    component: Importer,
    title: 'Import Workflow'
  }, {
    name: 'import-tool', // legacy
    path: '/import-tool/:source/:item(.*)',
    component: props => h(Nav.Redirector, { pathname: Nav.getPath('import-workflow', props, { encode: _.identity }) })
  }
]
