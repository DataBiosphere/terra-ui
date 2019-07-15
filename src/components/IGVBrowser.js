import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { saToken } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


export const IGVBrowser = ({ selectedFiles, refGenome, namespace }) => {
  const containerRef = useRef()
  const [loadingIgv, setLoadingIgv] = useState(true)

  Utils.useOnMount(() => {
    const getTrack = filePath => {
      const fileTypeToTrack = {
        'bam': 'alignment',
        'cram': 'alignment',
        'bed': 'annotation',
        'vcf': 'variant'
      }

      return {
        type: fileTypeToTrack[_.last(filePath.split('.'))],
        name: filePath,
        url: filePath,
        // igv.js will automatically find the index file, but not for crams
        indexURL: filePath.endsWith('cram') ? filePath + '.crai' : ''
      }
    }

    const options = {
      genome: refGenome,
      tracks: _.map(getTrack, selectedFiles)
    }

    const igvSetup = async () => {
      try {
        const { default: igv } = await import('igv')

        igv.oauth.google.setToken(saToken(namespace))
        igv.createBrowser(containerRef.current, options)
      } catch (e) {
        reportError('Error loading IGV.js', e)
      } finally {
        setLoadingIgv(false)
      }
    }

    igvSetup()
  })


  return (
    h(Fragment, [
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
  )
}
