import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { pageColumn } from 'src/components/common'
import { TopBar } from 'src/components/TopBar'
import { DestinationProject } from 'src/pages/ImportTool'
import { Orchestration } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'


class Importer extends Component {
  render() {
    const { queryParams: { url } } = this.props
    const { isImporting, selectedWorkspace } = this.state

    return h(Fragment, [
      h(TopBar, { title: 'Import Data' }),
      // 23rem allows enough space for the opened selection box.
      div({ style: { display: 'flex', minHeight: '23rem' } },
        [
          pageColumn('Importing', 5, div({}, [
            div({ style: { overflowX: 'auto', whiteSpace: 'nowrap' } }, url)
          ])),
          pageColumn('Destination Project', 3,
            h(DestinationProject, {
              isImporting,
              selectedWorkspace,
              onWorkspaceSelected: selectedWorkspace => this.setState({ selectedWorkspace }),
              import_: () => this.import_()
            }))
        ]
      )
    ])
  }

  async import_() {
    this.setState({ isImporting: true })
    const { selectedWorkspace: { value: { namespace, name } } } = this.state
    const { queryParams: { url } } = this.props

    try {
      await Orchestration.workspaces(namespace, name).importBagit(url)
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
