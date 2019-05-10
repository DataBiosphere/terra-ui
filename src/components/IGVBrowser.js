import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
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

export const IGVBrowser = ({ selectedFiles, refGenome, userProject, namespace }) => {
  userProject ? console.log(userProject) : console.log('no user project')
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

      const j = {
        type: fileTypeToTrack[_.last(filePath.split('.'))],
        name: filePath,
        url: userProject ? filePath + '?userProject=' + userProject : filePath,
        // igv.js will automatically find the index file, but not for crams
        indexURL: userProject ?
          (filePath.endsWith('cram') ? filePath + '.crai?userProject=' + userProject : ''):
          filePath.endsWith('cram') ? filePath + '.crai' : ''
      }
      console.log(j)
      return j
    }

    const options = {
      genome: refGenome,
      tracks: _.map(getTrack, selectedFiles)
    }

    const igvSetup = async () => {
      try {
        const { default: igv } = await import('igv')

        igv.oauth.google.setToken(Ajax().User.token(namespace))
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
      div({ ref: containerRef, style: igvStyle })
    ])
  )
}
