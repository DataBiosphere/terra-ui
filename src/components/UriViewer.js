import * as clipboard from 'clipboard-polyfill'
import filesize from 'filesize'
import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment, useState } from 'react'
import { div, h, img, input } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import Collapse from 'src/components/Collapse'
import { ButtonPrimary, Clickable, Link } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import DownloadPrices from 'src/data/download-prices'
import { Ajax, ajaxCaller, useCancellation } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { requesterPaysBuckets, requesterPaysProjectStore, workspaceStore } from 'src/libs/state'
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

const parseUri = uri => _.drop(1, /gs:[/][/]([^/]+)[/](.+)/.exec(uri))
const getMaxDownloadCostNA = bytes => {
  const nanos = DownloadPrices.pricingInfo[0].pricingExpression.tieredRates[1].unitPrice.nanos
  const downloadPrice = bytes * nanos / DownloadPrices.pricingInfo[0].pricingExpression.baseUnitConversionFactor / 10e8

  return downloadPrice < 0.01 ? '< $0.01' : Utils.formatUSD(downloadPrice)
}

const PreviewContent = ({ uri, metadata, metadata: { bucket, name }, googleProject }) => {
  const signal = useCancellation()
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
  const signal = useCancellation()
  const [url, setUrl] = useState()
  const getUrl = async () => {
    try {
      const { url } = await Ajax(signal).Martha.getSignedUrl({ bucket, object: name, dataObjectUri: isGs(uri) ? undefined : uri })
      const workspace = workspaceStore.get()
      const userProject = workspace && Utils.canWrite(workspace.accessLevel) ? workspace.workspace.namespace : requesterPaysProjectStore.get()
      setUrl(_.includes(bucket, requesterPaysBuckets.get()) ? Utils.mergeQueryParams({ userProject }, url) : url)
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
  ajaxCaller,
  requesterPaysWrapper({ onDismiss: ({ onDismiss }) => onDismiss() })
)(class UriViewer extends Component {
  static propTypes = {
    googleProject: PropTypes.string.isRequired,
    uri: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props)
    this.state = { metadata: undefined, copied: undefined, loadingError: undefined }
  }


  async componentDidMount() {
    const { googleProject, uri, ajax: { Buckets, Martha }, onRequesterPaysError } = this.props
    try {
      if (isGs(uri)) {
        const [bucket, name] = parseUri(uri)
        const loadObject = withRequesterPaysHandler(onRequesterPaysError, () => {
          return Buckets.getObject(bucket, name, googleProject)
        })
        const metadata = await loadObject(bucket, name, googleProject)
        this.setState({ metadata })
      } else {
        const { dos: { data_object: { size, urls } } } = await Martha.getDataObjectMetadata(uri)
        const [bucket, name] = parseUri(_.find(u => u.startsWith('gs://'), _.map('url', urls)))
        this.setState({ metadata: { bucket, name, size } })
      }
    } catch (e) {
      this.setState({ loadingError: await e.json() })
    }
  }

  render() {
    const { uri, googleProject, onDismiss } = this.props
    const { metadata, copied, loadingError } = this.state
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
          els.cell([els.label('File size'), els.data(filesize(parseInt(size, 10)))]),
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
                  onClick: async () => {
                    try {
                      await clipboard.writeText(gsutilCommand)
                      this.setState({ copied: true }, () => {
                        setTimeout(() => this.setState({ copied: undefined }), 1500)
                      })
                    } catch (error) {
                      reportError('Error copying to clipboard', error)
                    }
                  }
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
  }
})

export class UriViewerLink extends Component {
  constructor(props) {
    super(props)
    this.state = { modalOpen: false }
  }

  render() {
    const { uri, googleProject } = this.props
    const { modalOpen } = this.state
    return h(Fragment, [
      h(Link, {
        style: { textDecoration: 'underline' },
        href: uri,
        onClick: e => {
          e.preventDefault()
          this.setState({ modalOpen: true })
        }
      }, [isGs(uri) ? _.last(uri.split('/')) : uri]),
      modalOpen && h(UriViewer, {
        onDismiss: () => this.setState({ modalOpen: false }),
        uri, googleProject
      })
    ])
  }
}

export default UriViewer
