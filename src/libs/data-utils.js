import clipboard from 'clipboard-polyfill/build/clipboard-polyfill'
import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, img, input } from 'react-hyperscript-helpers/lib/index'
import Collapse from 'src/components/Collapse'
import { buttonPrimary, Clickable, link, Select, spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { TextCell } from 'src/components/table'
import DownloadPrices from 'src/data/download-prices'
import ReferenceData from 'src/data/reference-data'
import { Buckets, Martha, Rawls } from 'src/libs/ajax'
import * as Config from 'src/libs/config'
import { reportError } from 'src/libs/error'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const els = {
  cell: children => div({ style: { marginBottom: '0.5rem' } }, children),
  label: text => div({ style: { fontWeight: 500 } }, text),
  data: children => div({ style: { marginLeft: '2rem', marginTop: '0.5rem' } }, children)
}

const isImage = ({ contentType, name }) => {
  return /^image/.test(contentType) ||
    /\.jpe?g$/.test(name) || /\.png$/.test(name) || /\.svg$/.test(name) || /\.bmp$/.test(name)
}

const isText = ({ contentType, name }) => {
  return /^text/.test(contentType) ||
    /\.txt$/.test(name) || /\.[ct]sv$/.test(name) || /\.log/.test(name)
}

const isFilePreviewable = ({ size, ...metadata }) => {
  return isText(metadata) || (isImage(metadata) && size <= 1e9)
}

const parseUri = uri => _.drop(1, /gs:[/][/]([^/]+)[/](.+)/.exec(uri))
const getMaxDownloadCostNA = async bytes => {
  const nanos = DownloadPrices.pricingInfo[0].pricingExpression.tieredRates[1].unitPrice.nanos
  const downloadPrice = bytes * nanos / DownloadPrices.pricingInfo[0].pricingExpression.baseUnitConversionFactor / 10e8

  return downloadPrice < 0.01 ? '< $0.01' : `$${downloadPrice.toPrecision(2)}`
}

/**
 * @param uri
 * @param googleProject
 */
export class UriViewer extends Component {
  constructor(props) {
    super(props)

    const { uri } = props

    this.state = { uri: _.startsWith('gs://', uri) ? uri : undefined }
  }

  async getMetadata(uri) {
    const { googleProject } = this.props
    const [bucket, object] = parseUri(uri)

    const [metadata, firecloudApiUrl] = await Promise.all([
      Buckets.getObject(bucket, object, googleProject),
      Config.getOrchestrationUrlRoot()
    ])

    const price = await getMaxDownloadCostNA(metadata.size)

    const preview = isFilePreviewable(metadata) &&
      await Buckets.getObjectPreview(bucket, object, googleProject, isImage(metadata)).then(
        res => isImage(metadata) ? res.blob().then(URL.createObjectURL) : res.text()
      )

    this.setState({ metadata, firecloudApiUrl, price, preview })
  }

  async resolveUri() {
    const { uri } = this.props

    if (!_.startsWith('gs://', uri)) {
      const gsUri = await Martha.call(uri)
      this.setState({ uri: gsUri })
      this.getMetadata(gsUri)
    } else {
      this.getMetadata(uri)
    }
  }

  renderMetadata() {
    const { uri, metadata, preview, firecloudApiUrl, price, copied } = this.state
    const [bucket, object] = parseUri(uri)
    const gsutilCommand = `gsutil cp ${uri} .`

    return h(Fragment,
      !metadata ? ['Loading metadata...', spinner()] :
        [
          els.cell(isFilePreviewable(metadata) ? [
            els.label('Preview'),
            Utils.cond(
              [
                isImage(metadata), () => img({ src: preview, width: 400 })
              ], [
                preview, () => div({
                  style: {
                    whiteSpace: 'pre-wrap', fontFamily: 'Menlo, monospace', fontSize: 12,
                    overflowY: 'auto', maxHeight: 206,
                    marginTop: '0.5rem', padding: '0.5rem',
                    background: Style.colors.background, borderRadius: '0.2rem'
                  }
                }, [preview])
              ]
            )
          ] : [els.label(isImage(metadata) ? 'Image is to large to preview.' : `File can't be previewed.`)]),
          els.cell([els.label('File size'), els.data(filesize(parseInt(metadata.size, 10)))]),
          els.cell([
            link({
              target: 'blank',
              href: Utils.bucketBrowserUrl(bucket)
            }, ['View this file in the Google Cloud Storage Browser'])
          ]),
          els.cell([
            buttonPrimary({
              onClick: () => window.open(`${firecloudApiUrl}/cookie-authed/download/b/${bucket}/o/${object}`)
            }, [`Download for ${price}*`])
          ]),
          els.cell([
            els.label('Terminal download command'),
            els.data([
              div({ style: { display: 'flex' } }, [
                input({
                  readOnly: true,
                  value: gsutilCommand,
                  style: { flexGrow: 1, fontWeight: 300, fontFamily: 'Menlo, monospace' }
                }),
                h(Clickable, {
                  style: { margin: '0 1rem', color: copied ? Style.colors.success : Style.colors.secondary },
                  tooltip: 'Copy to clipboard',
                  onClick: async () => {
                    try {
                      await clipboard.writeText(gsutilCommand)
                      this.setState({ copied: true },
                        () => setTimeout(() => this.setState({ copied: undefined }), 1500))
                    } catch (error) {
                      reportError('Error copying to clipboard', error)
                    }
                  }
                }, [icon(copied ? 'check' : 'copy-to-clipboard')])
              ])
            ])
          ]),
          h(Collapse, { title: 'More Information', defaultHidden: true, style: { marginTop: '2rem' } }, [
            metadata.timeCreated && els.cell([els.label('Created'), els.data(Utils.makePrettyDate(metadata.timeCreated))]),
            els.cell([els.label('Updated'), els.data(Utils.makePrettyDate(metadata.updated))]),
            els.cell([els.label('md5'), els.data(metadata.md5Hash)])
          ]),
          div({ style: { fontSize: 10 } }, ['* Estimated. Download cost may be higher in China or Australia.'])
        ]
    )
  }

  render() {
    const { uri: originalUri } = this.props
    const { uri, modalOpen } = this.state

    return h(Fragment, [
      link({
        onClick: () => {
          this.resolveUri()
          this.setState({ modalOpen: true })
        }
      }, _.startsWith('gs://', originalUri) ? _.last(originalUri.split('/')) : originalUri),
      modalOpen && h(Modal, {
        onDismiss: () => this.setState({ modalOpen: false }),
        title: 'File Details',
        showCancel: false,
        okButton: 'Done'
      },
      Utils.cond([
        uri, () => {
          const fileName = _.last(uri.split('/'))

          return [
            els.cell([els.label('Filename'), els.data(fileName)]),
            this.renderMetadata()
          ]
        }
      ], () => ['Resolving DOS uri...', spinner()])
      )
    ])
  }
}

export const renderDataCell = (data, namespace) => {
  const isUri = datum => _.startsWith('gs://', datum) || _.startsWith('dos://', datum)

  const renderCell = datum => h(TextCell, { title: datum },
    [isUri(datum) ? h(UriViewer, { uri: datum, googleProject: namespace }) : datum])

  return _.isObject(data) ?
    data.items.map((v, i) => h(Fragment, { key: v }, [
      renderCell(v), i < (data.items.length - 1) && div({ style: { marginRight: '0.5rem' } }, ',')
    ])) :
    renderCell(data)
}

export class ReferenceDataImporter extends Component {
  render() {
    const { onDismiss, onSuccess, namespace, name } = this.props
    const { loading, selectedReference } = this.state

    return h(Modal, {
      onDismiss,
      title: 'Add Reference Data',
      okButton: buttonPrimary({
        disabled: !selectedReference || loading,
        onClick: () => {
          this.setState({ loading: true })
          Rawls.workspace(namespace, name).shallowMergeNewAttributes(
            _.mapKeys(k => `referenceData-${selectedReference}-${k}`, ReferenceData[selectedReference])
          ).then(
            onSuccess,
            error => {
              reportError('Error importing reference data', error)
              onDismiss()
            }
          )
        }
      }, 'OK')
    }, [
      h(Select, {
        searchable: false,
        clearable: false,
        placeholder: 'Select data',
        value: selectedReference,
        onChange: ({ value }) => this.setState({ selectedReference: value }),
        options: _.map(name => {
          return { label: name, value: name }
        }, _.keys(ReferenceData))
      }),
      loading && spinnerOverlay
    ])
  }
}
