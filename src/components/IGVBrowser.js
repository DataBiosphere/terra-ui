import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { saToken } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'

// format for selectedFiles prop: [{ filePath, indexFilePath } }]
const IGVBrowser = ({ selectedFiles, refGenome, namespace, onDismiss }) => {
  const containerRef = useRef()
  const [loadingIgv, setLoadingIgv] = useState(true)

  Utils.useOnMount(() => {
    const options = {
      genome: refGenome,
      tracks: _.map(({ filePath, indexFilePath }) => ({
        name: `${_.last(filePath.split('/'))} (${filePath})`,
        url: filePath,
        indexURL: indexFilePath
      }), selectedFiles)
    }

    const igvSetup = async () => {
      try {
        const { default: igv } = await import('igv')

        igv.setGoogleOauthToken(() => saToken(namespace))
        igv.createBrowser(containerRef.current, options)
      } catch (e) {
        reportError('Error loading IGV.js', e)
      } finally {
        setLoadingIgv(false)
      }
    }

    igvSetup()
  })


  return h(Fragment, [
    h(Link, {
      onClick: onDismiss,
      style: { alignSelf: 'flex-start', display: 'flex', alignItems: 'center', padding: '6.5px 8px' }
    }, [icon('arrowLeft', { style: { marginRight: '0.5rem' } }), 'Back to data table']),
    loadingIgv && centeredSpinner(),
    div({
      ref: containerRef,
      style: {
        padding: '10px 0',
        margin: 8,
        border: `1px solid ${colors.dark(0.25)}`
      }
    })
  ])
}

export default IGVBrowser
