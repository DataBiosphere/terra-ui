import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { saToken } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getUserProjectForWorkspace, parseGsUri } from 'src/libs/data-utils'
import { reportError } from 'src/libs/error'
import { knownBucketRequesterPaysStatuses } from 'src/libs/state'
import * as Utils from 'src/libs/utils'

// format for selectedFiles prop: [{ filePath, indexFilePath } }]
const IGVBrowser = ({ selectedFiles, refGenome, workspace, onDismiss }) => {
  const containerRef = useRef()
  const [loadingIgv, setLoadingIgv] = useState(true)

  Utils.useOnMount(() => {
    const options = {
      genome: refGenome,
      tracks: _.map(({ filePath, indexFilePath }) => {
        const [bucket] = parseGsUri(filePath)
        const userProjectParam = { userProject: knownBucketRequesterPaysStatuses.get()[bucket] ? getUserProjectForWorkspace(workspace) : undefined }

        return {
          name: `${_.last(filePath.split('/'))} (${filePath})`,
          url: Utils.mergeQueryParams(userProjectParam, filePath),
          indexURL: Utils.mergeQueryParams(userProjectParam, indexFilePath)
        }
      }, selectedFiles)
    }

    const igvSetup = async () => {
      try {
        const { default: igv } = await import('igv')

        igv.setGoogleOauthToken(() => saToken(workspace.namespace))
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
