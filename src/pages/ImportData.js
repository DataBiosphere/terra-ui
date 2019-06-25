import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { backgroundLogo, spinnerOverlay } from 'src/components/common'
import TopBar from 'src/components/TopBar'
import { WorkspaceImporter } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  container: {
    display: 'flex', alignItems: 'flex-start', flex: 'auto',
    position: 'relative', padding: '2rem'
  },
  title: {
    fontSize: 24, fontWeight: 600, color: colors.dark(), marginBottom: '2rem'
  },
  card: {
    borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.85)', padding: '2rem',
    flex: 1, minWidth: 0, boxShadow: Style.standardShadow
  }
}

const Importer = class Importer extends Component {
  render() {
    const { queryParams: { url, ad, wid } } = this.props
    const { isImporting } = this.state

    return h(Fragment, [
      backgroundLogo(),
      h(TopBar, { title: 'Import Data' }),
      div({ style: styles.container }, [
        div({ style: styles.card }, [
          div({ style: styles.title }, ['Importing Data']),
          div({ style: { fontSize: 16 } }, ['From: ', new URL(url).hostname])
        ]),
        div({ style: { ...styles.card, marginLeft: '2rem' } }, [
          div({ style: styles.title }, ['Destination Workspace']),
          h(WorkspaceImporter, {
            authorizationDomain: ad,
            selectedWorkspaceId: wid,
            onImport: ws => this.import_(ws)
          }),
          isImporting && spinnerOverlay
        ])
      ])
    ])
  }

  async import_({ namespace, name }) {
    this.setState({ isImporting: true })
    const { queryParams: { url, format } } = this.props

    try {
      await Utils.switchCase(format,
        ['entitiesJson', () => Ajax().Workspaces.workspace(namespace, name).importEntities(url)],
        [Utils.DEFAULT, () => Ajax().Workspaces.workspace(namespace, name).importBagit(url)]
      )
      Nav.goToPath('workspace-data', { namespace, name })
    } catch (e) {
      reportError('Import Error', e)
    } finally {
      this.setState({ isImporting: false })
    }
  }
}


export const navPaths = [
  {
    name: 'import-data',
    path: '/import-data',
    component: Importer,
    title: 'Import Data'
  }
]
