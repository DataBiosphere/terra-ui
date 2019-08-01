import { iframeResizer } from 'iframe-resizer'
import _ from 'lodash/fp'
import { useLayoutEffect, useRef } from 'react'
import { h, iframe } from 'react-hyperscript-helpers'
import datasets from 'src/data/datasets'
import * as Nav from 'src/libs/nav'


const DataExplorerFrame = ({ dataset }) => {
  const elem = useRef()
  const { origin } = _.find({ name: dataset }, datasets)

  useLayoutEffect(() => {
    iframeResizer({
      onMessage: ({ message: { importDataQueryStr, deQueryStr } }) => {
        if (importDataQueryStr) {
          Nav.history.push({
            pathname: Nav.getPath('import-data'),
            search: `?${importDataQueryStr}`
          })
        } else if (deQueryStr) {
          // Propagate Data Explorer URL params to app.terra.bio.
          // Don't call Nav.history.replace(). That will trigger a request and
          // cause the page to flicker.
          window.history.replaceState({}, `Data Explorer - ${dataset}`, `#${Nav.history.location.pathname.slice(1)}?${deQueryStr}`)
        }
      }
    }, elem.current)
  }, [dataset])

  return h(iframe, { src: `${origin}/?embed&${Nav.history.location.search.slice(1)}`, style: { border: 'none' } })
}

export default DataExplorerFrame
