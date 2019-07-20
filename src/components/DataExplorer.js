import _ from 'lodash/fp'
import { Component } from 'react'
import { h } from 'react-hyperscript-helpers'
import IframeResizer from 'react-iframe-resizer-super'
import datasets from 'src/libs/datasets'
import * as Nav from 'src/libs/nav'

export default class DataExplorer extends Component {
  render() {
    const { dataset } = this.props
    const { origin } = _.find({ name: dataset }, datasets)

     return h(IframeResizer, {
      src: origin + '/?embed&' + Nav.history.location.search.slice(1),
      iframeResizerOptions: {
        onMessage: ({ iframe, message }) => {
          if (message.importDataQueryStr) {
            Nav.history.push({
              pathname: Nav.getPath('import-data'),
              search: '?' + message.importDataQueryStr
            })
          } else if (message.deQueryStr) {
            // Propagate Data Explorer URL params to app.terra.bio.
            // Don't call Nav.history.replace(). That will trigger a request and
            // cause the page to flicker.
            const url = window.location.origin + '#' + Nav.history.location.pathname.slice(1) + '?' + message.deQueryStr
            window.history.replaceState({}, 'Data Explorer - ' + dataset, url)
          }
        }
      }
    })
  }
}
