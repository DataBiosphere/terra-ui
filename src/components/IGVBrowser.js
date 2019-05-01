import _ from 'lodash/fp'
import { useRef, useState } from 'react'
import { div } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


const igvStyle = {
  padding: '10px 0',
  margin: 8,
  border: `1px solid ${colors.gray[5]}`
}

export const IGVBrowser = ({ selectedFiles, refGenome }) => {
  const containerRef = useRef()
  const [loadingIgv, setLoadingIgv] = useState(true)

  Utils.useOnMount(async () => {
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

    try {
      const { default: igv } = await import('igv')

      igv.oauth.google.setToken(Ajax().User.token())
      igv.createBrowser(containerRef.current, options)
    } catch (e) {
      reportError('Error loading IGV.js', e)
    } finally {
      setLoadingIgv(false)
    }
  })


  return (
    div({ ref: containerRef, style: igvStyle }, [loadingIgv && centeredSpinner()])
  )
}
