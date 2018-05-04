import _ from 'lodash'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { buttonPrimary } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { TopBar } from 'src/components/TopBar'
import WDLViewer from 'src/components/WDLViewer'
import { Dockstore, Rawls } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component, Select } from 'src/libs/wrapped-components'


const mutabilityWarning = 'Please note: Dockstore cannot guarantee that the WDL and Docker image referenced by ' +
  'this Workflow will not change. We advise you to review the WDL before future runs.'
const wdlLoadError = 'Error loading WDL. Please verify the workflow path and version and ensure this workflow supports WDL.'

class DockstoreImporter extends Component {
  render() {
    const { wdl, loadError } = this.state

    return Utils.cond(
      [wdl, this.renderImport],
      [loadError, this.renderError],
      spinner
    )
  }

  componentDidMount() {
    const { id, version } = this.props

    Dockstore.getWdl(id, version).then(
      ({ descriptor }) => this.setState({ wdl: descriptor }),
      failure => this.setState({ loadError: failure })
    )

    Rawls.workspacesList().then(workspaces => this.setState({ workspaces }))
  }

  renderImport = () => {
    function section(title, flex, contents) {
      return div(
        { style: { flex, overflow: 'hidden', margin: '3rem' } },
        [
          div({ style: _.merge({ fontWeight: 500, marginBottom: '1rem' }, Style.elements.sectionHeader) }, title),
          contents
        ])
    }

    return div({ style: { display: 'flex' } },
      [
        section('Importing', 5, this.renderWdlArea()),
        section('Destination Project', 3, this.renderWorkspaceArea())
      ]
    )
  }

  renderWdlArea = () => {
    const { id, version } = this.props
    const { wdl } = this.state

    return div(
      {
        style: {
          borderRadius: 5, backgroundColor: 'white', padding: '1rem',
          boxShadow: `0 0 2px 0 rgba(0,0,0,0.12), ${Style.standardShadow}`
        }
      },
      [
        div({ style: { fontSize: 16 } }, `From Dockstore - ${id}`),
        div({}, `V. ${version}`),
        div({
            style: {
              display: 'flex', alignItems: 'center',
              margin: '1rem 0', color: Style.colors.warning
            }
          },
          [
            icon('warning-standard', { class: 'is-solid', size: 36, style: { marginRight: '0.5rem' } }),
            mutabilityWarning
          ]),
        h(Collapse, { title: 'REVIEW WDL' },
          [h(WDLViewer, { wdl })])
      ]
    )
  }

  renderWorkspaceArea = () => {
    const { selectedWorkspace, workspaces } = this.state

    return div({},
      [
        h(Select, {
          clearable: false,
          searchable: true,
          disabled: !workspaces,
          placeholder: workspaces ? 'Select a workspace' : 'Loading workspaces...',
          value: selectedWorkspace,
          onChange: selectedWorkspace => this.setState({ selectedWorkspace }),
          options: _.map(workspaces, workspace => {
            const { name } = workspace.workspace
            return { value: name, label: name, data: workspace }
          })
        }),
        buttonPrimary({ style: { marginTop: '1rem' } }, 'Import')
      ]
    )
  }

  renderError = () => {
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
      h(TopBar, { title: 'Import' }),
      Utils.cond(
        [source === 'dockstore', this.renderDockstore],
        () => `Unknown source '${source}'`
      )
    ])
  }

  renderDockstore = () => {
    const { item } = this.props
    const [id, version] = item.split(':')
    return h(DockstoreImporter, { id, version })
  }
}


export const addNavPaths = () => {
  Nav.defPath(
    'import',
    {
      component: Importer,
      regex: /import\/([^/]+)\/(.+)$/,
      makeProps: (source, item) => ({ source, item }),
      makePath: (source, item) => `/import/${source}/${item}`
    }
  )
}
