import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import IframeResizer from 'react-iframe-resizer-super'
import { commonPaths } from 'src/components/breadcrumbs'
import TopBar from 'src/components/TopBar'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'


const datasetToUrl = {
  // key must be dataset name from Data Explorer dataset.json
  '1000 Genomes': 'https://test-data-explorer.appspot.com/?embed'
}


const DataExplorer = props => {
  return h(Fragment, [
    h(TopBar, { title: 'Library', href: Nav.getLink('library-datasets') }, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        div({}, commonPaths.datasetList()),
        div({ style: Style.breadcrumb.textUnderBreadcrumb }, [
          'Data Explorer - ' + props.dataset
        ])
      ])
    ]),
    h(IframeResizer, {
      src: datasetToUrl[props.dataset] + '&' + Nav.history.location.search.slice(1),
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
            window.history.replaceState({}, 'Data Explorer - ' + props.dataset, url)
          }
        }
      }
    })
  ])
}


export const navPaths = [
  {
    name: 'library-datasets-data-explorer',
    path: '/library/datasets/:dataset/data-explorer',
    component: DataExplorer,
    public: true,
    title: ({ dataset }) => `${dataset} - Data Explorer`
  }
]
