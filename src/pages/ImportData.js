import { Fragment } from 'react'
import { br, div, h } from 'react-hyperscript-helpers'
import { pageColumn } from 'src/components/common'
import { TopBar } from 'src/components/TopBar'
import { DestinationProject } from 'src/pages/ImportTool'
import { Orchestration } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'


class Importer extends Component {
  render() {
    // TODO(dmohs): This should be handled by the router.
    const url = decodeURIComponent(this.props.url)
    const { selectedWorkspace } = this.state

    return h(Fragment, [
      h(TopBar, { title: 'Import Data' }),
      // 23rem allows enough space for the opened selection box.
      div({ style: { display: 'flex', minHeight: '23rem' } },
        [
          pageColumn('Importing', 5, div({}, ['Data URL:', br(), url])),
          pageColumn('Destination Project', 3,
            h(DestinationProject, {
              selectedWorkspace,
              onWorkspaceSelected: selectedWorkspace => this.setState({ selectedWorkspace }),
              import_: () => this.import_()
            }))
        ]
      )
    ])
  }

  import_() {
    const { selectedWorkspace: { value: { namespace, name } } } = this.state
    const url = decodeURIComponent(this.props.url)

    return Orchestration.workspaces(namespace, name).importBagit(url).then(() => {
      Nav.goToPath('workspace', { namespace, name, activeTab: 'data' })
    })
  }
}


export const addNavPaths = () => {
  Nav.defPath('import-data', {
    path: '/import-data/:url',
    // eslint-disable-next-line
    // TODO(dmohs): This would be preferred, in my opinion.
    // path: '/import-data/?url=:url',
    component: Importer
  })
}
