import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, img, input } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { ClipboardButton } from 'src/components/ClipboardButton'
import Collapse from 'src/components/Collapse'
import { ButtonPrimary, Link } from 'src/components/common'
import { FileProvenance } from 'src/components/data/data-table-provenance'
import { getDownloadCommand, getUserProjectForWorkspace, parseGsUri } from 'src/components/data/data-utils'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import DownloadPrices from 'src/data/download-prices'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews'
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils'
import { knownBucketRequesterPaysStatuses, workspaceStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { isAzureWorkspace } from 'src/libs/workspace-utils'


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

export const isGs = uri => _.startsWith('gs://', uri)

export const isDrs = uri => _.startsWith('dos://', uri) || _.startsWith('drs://', uri)

export const isAzureUri = uri => {
  const azureRegex = RegExp('https://(.+).blob.core.windows.net')
  return azureRegex.test(uri)
}

const getMaxDownloadCostNA = bytes => {
  const nanos = DownloadPrices.pricingInfo[0].pricingExpression.tieredRates[1].unitPrice.nanos
  const downloadPrice = bytes * nanos / DownloadPrices.pricingInfo[0].pricingExpression.baseUnitConversionFactor / 10e8

  return Utils.formatUSD(downloadPrice)
}

// TODO: Will need to eventually add Azure support
const PreviewContent = ({ metadata, metadata: { bucket, name }, googleProject }) => {
  const signal = useCancellation()
  const [preview, setPreview] = useState()
  const loadPreview = async () => {
    try {
      const res = await Ajax(signal).Buckets.getObjectPreview(googleProject, bucket, name, isImage(metadata))
      if (isImage(metadata)) {
        setPreview(URL.createObjectURL(await res.blob()))
      } else {
        setPreview(await res.text())
      }
    } catch (error) {
      setPreview(null)
    }
  }
  useOnMount(() => isFilePreviewable(metadata) && loadPreview())
  return els.cell([
    Utils.cond(
      [isFilePreviewable(metadata), () => h(Fragment, [
        els.label('Preview'),
        Utils.cond(
          [preview === null, () => 'Unable to load preview.'],
          [preview === undefined, () => 'Loading preview...'],
          [isImage(metadata), () => img({ src: preview, width: 400 })],
          () => div({ style: styles.previewText }, [preview])
        )
      ])],
      [isImage(metadata), () => els.label('Image is too large to preview')],
      () => els.label('File can\'t be previewed.')
    )
  ])
}

const DownloadButton = ({ uri, metadata: { bucket, name, fileName, size }, accessUrl }) => {
  const signal = useCancellation()
  const [url, setUrl] = useState()
  const getUrl = async () => {
    if (accessUrl?.url) {
      /*
      NOTE: Not supporting downloading using `accessUrl.headers`:
      - https://ga4gh.github.io/data-repository-service-schemas/preview/release/drs-1.1.0/docs/#_accessurl

      If we want to support supplying `accessUrl.headers` here we'll probably need a bigger solution.
      As of 2021-05-17 a google search turned up this c. 2018 result that mentioned something called `ServiceWorker`
      - https://stackoverflow.com/questions/51721904/make-browser-submit-additional-http-header-if-click-on-hyperlink#answer-51784608
       */
      setUrl(_.isEmpty(accessUrl.headers) ? accessUrl.url : null)
    } else {
      try {
        // This is still using Martha instead of DrsHub because DrsHub has not yet implemented signed URLs
        const { url } = await Ajax(signal).DrsUriResolver.getSignedUrl({
          bucket,
          object: name,
          dataObjectUri: isDrs(uri) ? uri : undefined
        })
        const workspace = workspaceStore.get()
        const userProject = await getUserProjectForWorkspace(workspace)
        setUrl(knownBucketRequesterPaysStatuses.get()[bucket] ? Utils.mergeQueryParams({ userProject }, url) : url)
      } catch (error) {
        setUrl(null)
      }
    }
  }
  useOnMount(() => {
    getUrl()
  })
  return els.cell([
    url === null ?
      'Unable to generate download link.' :
      div({ style: { display: 'flex', justifyContent: 'center' } }, [
        h(ButtonPrimary, {
          disabled: !url,
          onClick: () => {
            Ajax().Metrics.captureEvent(Events.workspaceDataDownload, {
              ...extractWorkspaceDetails(workspaceStore.get().workspace),
              fileType: _.head((/\.\w+$/).exec(uri)),
              downloadFrom: 'file direct'
            })
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
  withDisplayName('UriViewer'),
  requesterPaysWrapper({ onDismiss: ({ onDismiss }) => onDismiss() })
)(({ workspace, uri, onDismiss, onRequesterPaysError }) => {
  const { workspace: { googleProject } } = workspace

  const signal = useCancellation()
  const [metadata, setMetadata] = useState()
  const [loadingError, setLoadingError] = useState()

  const loadMetadata = async () => {
    try {
      if (isGs(uri)) {
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
        !isAzureUri(uri) && h(PreviewContent, { metadata, googleProject }),
        els.cell([els.label('File size'), els.data(filesize(size))]),
        !accessUrl && !!gsUri && els.cell([
          h(Link, {
            ...Utils.newTabLinkProps,
            href: bucketBrowserUrl(gsUri.match(/gs:\/\/(.+)\//)[1])
          }, ['View this file in the Google Cloud Storage Browser'])
        ]),
        h(DownloadButton, { uri, metadata, accessUrl }),
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
        isGs(uri) ? 'Loading metadata...' : 'Resolving DRS object...',
        spinner({ style: { marginLeft: 4 } })
      ])
    )
  ])
})

export const UriViewerLink = ({ uri, workspace }) => {
  const [modalOpen, setModalOpen] = useState(false)
  return h(Fragment, [
    h(Link, {
      style: { textDecoration: 'underline' },
      href: uri,
      onClick: e => {
        e.preventDefault()
        setModalOpen(true)
      }
    }, [isGs(uri) || isAzureUri(uri) ? _.last(uri.split(/\/\b/)) : uri]),
    modalOpen && !isAzureWorkspace(workspace) && h(UriViewer, {
      onDismiss: () => setModalOpen(false),
      uri, workspace
    })
  ])
}

export default UriViewer
