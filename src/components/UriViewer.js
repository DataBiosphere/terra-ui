import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, img, input } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import Collapse from 'src/components/Collapse'
import { ButtonPrimary, ClipboardButton, Link } from 'src/components/common'
import { getUserProjectForWorkspace, parseGsUri } from 'src/components/data/data-utils'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import DownloadPrices from 'src/data/download-prices'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import Events from 'src/libs/events'
import { knownBucketRequesterPaysStatuses, workspaceStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const styles = {
  previewText: {
    whiteSpace: 'pre', fontFamily: 'Menlo, monospace', fontSize: 12,
    overflowY: 'auto', maxHeight: 206,
    marginTop: '0.5rem', padding: '0.5rem',
    background: colors.dark(0.25), borderRadius: '0.2rem'
  }
}

const els = {
  cell: children => div({ style: { marginBottom: '0.5rem' } }, children),
  label: text => div({ style: { fontWeight: 500 } }, text),
  data: children => div({ style: { marginLeft: '2rem', marginTop: '0.5rem' } }, children)
}

const isImage = ({ contentType, name }) => {
  return /^image/.test(contentType) ||
    /\.(?:(jpe?g|png|svg|bmp))$/.test(name)
}

const isText = ({ contentType, name }) => {
  return /(?:(^text|application\/json))/.test(contentType) ||
    /\.(?:(txt|[ct]sv|log|json))$/.test(name)
}

const isBinary = ({ contentType, name }) => {
  // excluding json and google's default types (i.e. wasn't set to anything else)
  return /application(?!\/(json|octet-stream|x-www-form-urlencoded)$)/.test(contentType) ||
    /(?:(\.(?:(ba[mi]|cra[mi]|pac|sa|bwt|gz))$|\.gz\.))/.test(name)
}

const isFilePreviewable = ({ size, ...metadata }) => {
  return !isBinary(metadata) && (isText(metadata) || (isImage(metadata) && size <= 1e9))
}

const isGs = uri => _.startsWith('gs://', uri)

const getMaxDownloadCostNA = bytes => {
  const nanos = DownloadPrices.pricingInfo[0].pricingExpression.tieredRates[1].unitPrice.nanos
  const downloadPrice = bytes * nanos / DownloadPrices.pricingInfo[0].pricingExpression.baseUnitConversionFactor / 10e8

  return Utils.formatUSD(downloadPrice)
}

const PreviewContent = ({ uri, metadata, metadata: { bucket, name }, googleProject }) => {
  const signal = Utils.useCancellation()
  const [preview, setPreview] = useState()
  const loadPreview = async () => {
    try {
      const res = await Ajax(signal).Buckets.getObjectPreview(bucket, name, googleProject, isImage(metadata))
      if (isImage(metadata)) {
        setPreview(URL.createObjectURL(await res.blob()))
      } else {
        setPreview(await res.text())
      }
    } catch (error) {
      setPreview(null)
    }
  }
  Utils.useOnMount(() => {
    if (isGs(uri) && isFilePreviewable(metadata)) {
      loadPreview()
    }
  })
  return els.cell([
    Utils.cond(
      [isGs(uri) && isFilePreviewable(metadata), () => h(Fragment, [
        els.label('Preview'),
        Utils.cond(
          [preview === null, () => 'Unable to load preview.'],
          [preview === undefined, () => 'Loading preview...'],
          [isImage(metadata), () => img({ src: preview, width: 400 })],
          () => div({ style: styles.previewText }, [preview])
        )
      ])],
      [!isGs(uri), () => els.label(`DOS uri's can't be previewed`)],
      [isImage(metadata), () => els.label('Image is too large to preview')],
      () => els.label(`File can't be previewed.`)
    )
  ])
}

const DownloadButton = ({ uri, metadata: { bucket, name, fileName, size } }) => {
  const signal = Utils.useCancellation()
  const [url, setUrl] = useState()
  const getUrl = async () => {
    try {
      const { url } = await Ajax(signal).Martha.getSignedUrl({ bucket, object: name, dataObjectUri: isGs(uri) ? undefined : uri })
      const workspace = workspaceStore.get()
      const userProject = await getUserProjectForWorkspace(workspace)
      setUrl(knownBucketRequesterPaysStatuses.get()[bucket] ? Utils.mergeQueryParams({ userProject }, url) : url)
    } catch (error) {
      setUrl(null)
    }
  }
  Utils.useOnMount(() => {
    getUrl()
  })
  return els.cell([
    url === null ?
      'Unable to generate download link.' :
      div({ style: { display: 'flex', justifyContent: 'center' } }, [
        h(ButtonPrimary, {
          disabled: !url,
          onClick: () => {
            if (uri.toLowerCase().endsWith('.bam')) {
              Ajax().Metrics.captureEvent(Events.workspaceDataDownload, { downloadFrom: 'bam file' })
            }
          },
          href: url,
          /*
           NOTE:
           Some DOS/DRS servers return file names that are different from the end of the path in the gsUri/url.
           Attempt to hint to the browser the correct name.
           FYI this hint doesn't work in Chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=373182#c24
           */
          download: fileName,
          ...Utils.newTabLinkProps
        }, [
          url ?
            `Download for ${getMaxDownloadCostNA(size)}*` :
            h(Fragment, ['Generating download link...', spinner({ style: { color: 'white', marginLeft: 4 } })])
        ])
      ])
  ])
}

const UriViewer = _.flow(
  Utils.withDisplayName('UriViewer'),
  requesterPaysWrapper({ onDismiss: ({ onDismiss }) => onDismiss() })
)(({ googleProject, uri, onDismiss, onRequesterPaysError }) => {
  const signal = Utils.useCancellation()
  const [metadata, setMetadata] = useState()
  const [loadingError, setLoadingError] = useState()

  const loadMetadata = async () => {
    try {
      if (isGs(uri)) {
        const [bucket, name] = parseGsUri(uri)
        const loadObject = withRequesterPaysHandler(onRequesterPaysError, () => {
          return Ajax(signal).Buckets.getObject(bucket, name, googleProject)
        })
        const metadata = await loadObject(bucket, name, googleProject)
        setMetadata(metadata)
      } else {
        // Fields are mapped from the martha_v3 fields to those used by google
        // https://github.com/broadinstitute/martha#martha-v3
        // https://cloud.google.com/storage/docs/json_api/v1/objects#resource-representations
        // The time formats returned are in ISO 8601 vs. RFC 3339 but should be ok for parsing by `new Date()`
        const { bucket, name, size, timeCreated, timeUpdated: updated, fileName } =
          await Ajax(signal).Martha.getDataObjectMetadata(
            uri,
            ['bucket', 'name', 'size', 'timeCreated', 'timeUpdated', 'fileName']
          )
        const metadata = { bucket, name, fileName, size, timeCreated, updated }
        setMetadata(metadata)
      }
    } catch (e) {
      setLoadingError(await e.json())
    }
  }
  Utils.useOnMount(() => {
    loadMetadata()
  })

  const { size, timeCreated, updated, bucket, name, fileName } = metadata || {}
  const gsUri = `gs://${bucket}/${name}`
  const gsutilCommand = `gsutil cp ${gsUri} ${fileName || '.'}`
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
          div({ style: { whiteSpace: 'pre-wrap', fontFamily: 'monospace', overflowWrap: 'break-word' } }, [
            JSON.stringify(loadingError, null, 2)
          ])
        ])
      ])],
      [metadata, () => h(Fragment, [
        els.cell([
          els.label('Filename'),
          els.data((fileName || _.last(name.split('/'))).split('.').join('.\u200B')) // allow line break on periods
        ]),
        h(PreviewContent, { uri, metadata, googleProject }),
        els.cell([els.label('File size'), els.data(filesize(size))]),
        els.cell([
          h(Link, {
            ...Utils.newTabLinkProps,
            href: bucketBrowserUrl(gsUri.match(/gs:\/\/(.+)\//)[1])
          }, ['View this file in the Google Cloud Storage Browser'])
        ]),
        h(DownloadButton, { uri, metadata }),
        els.cell([
          els.label('Terminal download command'),
          els.data([
            div({ style: { display: 'flex' } }, [
              input({
                readOnly: true,
                value: gsutilCommand,
                style: { flexGrow: 1, fontWeight: 400, fontFamily: 'Menlo, monospace' }
              }),
              h(ClipboardButton, {
                text: gsutilCommand,
                style: { margin: '0 1rem' }
              })
            ])
          ])
        ]),
        (timeCreated || updated) && h(Collapse, {
          title: 'More Information',
          style: { marginTop: '2rem' }
        }, [
          timeCreated && els.cell([
            els.label('Created'),
            els.data(new Date(timeCreated).toLocaleString())
          ]),
          updated && els.cell([
            els.label('Updated'),
            els.data(new Date(updated).toLocaleString())
          ])
        ]),
        div({ style: { fontSize: 10 } }, ['* Estimated. Download cost may be higher in China or Australia.'])
      ])],
      () => h(Fragment, [
        isGs(uri) ? 'Loading metadata...' : 'Resolving DOS object...',
        spinner({ style: { marginLeft: 4 } })
      ])
    )
  ])
})

export const UriViewerLink = ({ uri, googleProject }) => {
  const [modalOpen, setModalOpen] = useState(false)
  return h(Fragment, [
    h(Link, {
      style: { textDecoration: 'underline' },
      href: uri,
      onClick: e => {
        e.preventDefault()
        setModalOpen(true)
      }
    }, [isGs(uri) ? _.last(uri.split('/')) : uri]),
    modalOpen && h(UriViewer, {
      onDismiss: () => setModalOpen(false),
      uri, googleProject
    })
  ])
}

export default UriViewer
