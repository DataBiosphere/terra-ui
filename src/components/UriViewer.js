import * as clipboard from 'clipboard-polyfill'
import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, img, input } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import Collapse from 'src/components/Collapse'
import { ButtonPrimary, Clickable, Link } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import DownloadPrices from 'src/data/download-prices'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getUserProjectForWorkspace, parseGsUri } from 'src/libs/data-utils'
import { withErrorReporting } from 'src/libs/error'
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

const parseMarthaResponse = response => {
  if (!response.dos) { // handle martha_v3 endpoint response
    return response
  }
  const { dos: { data_object: { size, urls } } } = response
  const gsUri = _.find(u => u.startsWith('gs://'), _.map('url', urls))
  return { size, gsUri }
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

const DownloadButton = ({ uri, metadata: { bucket, name, size } }) => {
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
          href: url,
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
  const [copied, setCopied] = useState()
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
        const response = await Ajax(signal).Martha.getDataObjectMetadata(uri)
        const { size, gsUri } = parseMarthaResponse(response)
        const [bucket, name] = parseGsUri(gsUri)
        setMetadata({ bucket, name, size })
      }
    } catch (e) {
      setLoadingError(await e.json())
    }
  }
  Utils.useOnMount(() => {
    loadMetadata()
  })

  const { size, timeCreated, updated, bucket, name } = metadata || {}
  const gsUri = `gs://${bucket}/${name}`
  const gsutilCommand = `gsutil cp ${gsUri} .`
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
          els.data(_.last(name.split('/')).split('.').join('.\u200B')) // allow line break on periods
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
              h(Clickable, {
                style: { margin: '0 1rem', color: colors.accent() },
                tooltip: 'Copy to clipboard',
                onClick: withErrorReporting('Error copying to clipboard', async () => {
                  await clipboard.writeText(gsutilCommand)
                  setCopied(true)
                  await Utils.delay(1500)
                  setCopied(undefined)
                })
              }, [icon(copied ? 'check' : 'copy-to-clipboard')])
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
