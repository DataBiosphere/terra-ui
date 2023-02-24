import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, input } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { ClipboardButton } from 'src/components/ClipboardButton'
import Collapse from 'src/components/Collapse'
import { Link } from 'src/components/common'
import { FileProvenance } from 'src/components/data/data-table-provenance'
import { getDownloadCommand, parseGsUri } from 'src/components/data/data-utils'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews'
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'

import els from './uri-viewer-styles'
import { isAzureUri, isGsUri } from './uri-viewer-utils'
import { UriDownloadButton } from './UriDownloadButton'
import { UriPreview } from './UriPreview'


export const UriViewer = _.flow(
  withDisplayName('UriViewer'),
  requesterPaysWrapper({ onDismiss: ({ onDismiss }) => onDismiss() })
)(({ workspace, uri, onDismiss, onRequesterPaysError }) => {
  const { workspace: { googleProject } } = workspace

  const signal = useCancellation()
  const [metadata, setMetadata] = useState()
  const [loadingError, setLoadingError] = useState()

  const loadMetadata = async () => {
    try {
      if (isGsUri(uri)) {
        const [bucket, name] = parseGsUri(uri)
        const loadObject = withRequesterPaysHandler(onRequesterPaysError, () => {
          return Ajax(signal).Buckets.getObject(googleProject, bucket, name)
        })
        const metadata = await loadObject(googleProject, bucket, name)
        setMetadata(metadata)
      } else {
        // TODO: change below comment after switch to DRSHub is complete, tracked in ticket [ID-170]
        // Fields are mapped from the martha_v3 fields to those used by google
        // https://github.com/broadinstitute/martha#martha-v3
        // https://cloud.google.com/storage/docs/json_api/v1/objects#resource-representations
        // The time formats returned are in ISO 8601 vs. RFC 3339 but should be ok for parsing by `new Date()`
        const { bucket, name, size, timeCreated, timeUpdated: updated, fileName, accessUrl } =
            await Ajax(signal).DrsUriResolver.getDataObjectMetadata(
              uri,
              ['bucket', 'name', 'size', 'timeCreated', 'timeUpdated', 'fileName', 'accessUrl']
            )
        const metadata = { bucket, name, fileName, size, timeCreated, updated, accessUrl }
        setMetadata(metadata)
      }
    } catch (e) {
      setLoadingError(await e.json())
    }
  }
  useOnMount(() => {
    loadMetadata()
  })

  const { size, timeCreated, updated, bucket, name, fileName, accessUrl } = metadata || {}
  const gsUri = `gs://${bucket}/${name}`
  const downloadCommand = getDownloadCommand(fileName, gsUri, accessUrl)
  if (isAzureUri(uri)) {
    return h(Modal, {
      onDismiss,
      title: 'File Details',
      showCancel: false,
      showX: true,
      okButton: 'Done'
    },
    [els.cell([
      els.label('Filename'),
      els.data(_.last(uri.split('/')).split('.').join('.\u200B')) // allow line break on periods
    ]), div({ style: { marginTop: '2rem', fontSize: 14 } }, ['Download functionality for Azure files coming soon'])])
  }
  return h(Modal, {
    onDismiss,
    title: 'File Details',
    showCancel: false,
    showX: true,
    okButton: 'Done'
  }, [
    Utils.cond(
      [loadingError, () => h(Fragment, [
        div({ style: { paddingBottom: '1rem' } }, [
          'Error loading data. This file does not exist or you do not have permission to view it.'
        ]),
        h(Collapse, { title: 'Details' }, [
          div({ style: { marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', overflowWrap: 'break-word' } }, [
            JSON.stringify(loadingError, null, 2)
          ])
        ])
      ])],
      [metadata, () => h(Fragment, [
        els.cell([
          els.label('Filename'),
          els.data((fileName || _.last(name.split('/'))).split('.').join('.\u200B')) // allow line break on periods
        ]),
        h(UriPreview, { metadata, googleProject }),
        els.cell([els.label('File size'), els.data(filesize(size))]),
        !accessUrl && !!gsUri && els.cell([
          h(Link, {
            ...Utils.newTabLinkProps,
            href: bucketBrowserUrl(gsUri.match(/gs:\/\/(.+)\//)[1])
          }, ['View this file in the Google Cloud Storage Browser'])
        ]),
        h(UriDownloadButton, { uri, metadata, accessUrl }),
        els.cell([
          els.label('Terminal download command'),
          els.data([
            div({ style: { display: 'flex' } }, [
              input({
                readOnly: true,
                value: downloadCommand,
                style: { flexGrow: 1, fontWeight: 400, fontFamily: 'Menlo, monospace' }
              }),
              h(ClipboardButton, {
                text: downloadCommand,
                style: { margin: '0 1rem' }
              })
            ])
          ])
        ]),
        (timeCreated || updated) && h(Collapse, {
          title: 'More Information',
          style: { marginTop: '2rem' },
          summaryStyle: { marginBottom: '0.5rem' }
        }, [
          timeCreated && els.cell([
            els.label('Created'),
            els.data(new Date(timeCreated).toLocaleString())
          ]),
          updated && els.cell([
            els.label('Updated'),
            els.data(new Date(updated).toLocaleString())
          ]),
          isFeaturePreviewEnabled('data-table-provenance') && els.cell([
            els.label('Where did this file come from?'),
            els.data([h(FileProvenance, { workspace, fileUrl: uri })])
          ])
        ]),
        div({ style: { fontSize: 10 } }, ['* Estimated. Download cost may be higher in China or Australia.'])
      ])],
      () => h(Fragment, [
        isGsUri(uri) ? 'Loading metadata...' : 'Resolving DRS file...',
        spinner({ style: { marginLeft: 4 } })
      ])
    )
  ])
})
