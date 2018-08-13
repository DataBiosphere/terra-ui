import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, pageColumn } from 'src/components/common'
import { TopBar } from 'src/components/TopBar'
import WorkspaceSelector from 'src/components/WorkspaceSelector'
import { Workspaces } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { spinner } from 'src/components/icons'


class Importer extends Component {
  render() {
    const { queryParams: { url, ad } } = this.props
    const { isImporting, selectedWorkspace } = this.state

    return h(Fragment, [
      h(TopBar, { title: 'Import Data' }),
      // 23rem allows enough space for the opened selection box.
      div({ style: { display: 'flex', minHeight: '23rem' } }, [
        pageColumn('Importing', 5, div({}, [
          div({ style: { overflowX: 'auto', whiteSpace: 'nowrap' } }, url)
        ])),
        pageColumn('Destination Workspace', 3, div({}, [
          h(WorkspaceSelector, {
            authorizationDomain: ad,
            selectedWorkspace,
            onWorkspaceSelected: selectedWorkspace => this.setState({ selectedWorkspace })
          }),
          buttonPrimary({
            style: { marginTop: '1rem' },
            disabled: !selectedWorkspace || isImporting,
            onClick: () => this.import_()
          }, ['Import']),
          isImporting && spinner({ style: { marginLeft: '0.5rem' } })
        ]))
      ])
    ])
  }

  async import_() {
    this.setState({ isImporting: true })
    const { selectedWorkspace: { value: { namespace, name } } } = this.state
    const { queryParams: { url, format } } = this.props

    try {
      await Utils.switchCase(format,
        ['entitiesJson', () => Workspaces.workspace(namespace, name).importEntities(url)],
        [Utils.DEFAULT, () => Workspaces.workspace(namespace, name).importBagit(url)]
      )
      Nav.goToPath('workspace-data', { namespace, name })
    } catch (e) {
      reportError('Import Error', e)
    } finally {
      this.setState({ isImporting: false })
    }
  }
}


export const addNavPaths = () => {
  Nav.defPath('import-data', {
    path: '/import-data',
    component: Importer,
    title: 'Import Data'
  })
}
