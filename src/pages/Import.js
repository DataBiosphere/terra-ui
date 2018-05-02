import { Fragment } from 'react'
import { div, h, pre, span } from 'react-hyperscript-helpers'
import { spinner } from 'src/components/icons'
import { TopBar } from 'src/components/TopBar'
import { Dockstore } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


class DockstoreImporter extends Component {
  render() {
    const { wdl, loadError } = this.state
    return Utils.cond(
      [wdl, this.renderWdl],
      [loadError, this.renderError],
      spinner
    )
  }

  componentDidMount() {
    const { id, version } = this.props
    Dockstore.getWdl(id, version).then(
      success => this.setState({ wdl: success['descriptor'] }),
      failure => this.setState({ loadError: failure })
    )
  }

  renderWdl = () => {
    return h(pre, [this.state.wdl])
  }

  renderError = () => {
    return h(Fragment, [
      div('Error loading WDL. Please verify the workflow path and version and ensure this workflow supports WDL.'),
      div(`Error: ${this.state.loadError}`)
    ])
  }
}


class Importer extends Component {
  render() {
    const { source, item } = this.props

    return h(Fragment, [
      h(TopBar, { title: 'Import' }, [
        div({ style: { display: 'flex', flexDirection: 'column', flexShrink: 0, paddingLeft: '4rem' } },
          [
            span(source),
            span(item)
          ])
      ]),
      Utils.cond(
        [source === 'dockstore', this.renderDockstore],
        () => `Unknown source '${source}'`
      )
    ])
  }

  renderDockstore = () => {
    const [id, version] = this.props.item.split(':')
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
