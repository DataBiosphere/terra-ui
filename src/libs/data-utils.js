import clipboard from 'clipboard-polyfill/build/clipboard-polyfill'
import filesize from 'filesize'
import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { div, h, img, input } from 'react-hyperscript-helpers/lib/index'
import Collapse from 'src/components/Collapse'
import { buttonPrimary, Clickable, link, Select, spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { TextCell } from 'src/components/table'
import DownloadPrices from 'src/data/download-prices'
import ReferenceData from 'src/data/reference-data'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


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
  return /application(?!\/json)/.test(contentType) ||
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

  return downloadPrice < 0.01 ? '< $0.01' : `$${downloadPrice.toPrecision(2)}`
}

const UriViewer = ajaxCaller(class UriViewer extends Component {
  static propTypes = {
    googleProject: PropTypes.string.isRequired,
    uri: PropTypes.string.isRequired
  }

  async getMetadata() {
    const { googleProject, uri, ajax: { Buckets, Martha } } = this.props
    const isGsUri = isGs(uri)
    const [bucket, name] = isGsUri ? parseUri(uri) : []

    try {
      const { signedUrl = false, ...metadata } = isGsUri ? await Buckets.getObject(bucket, name, googleProject) : await Martha.call(uri)

      const price = getMaxDownloadCostNA(metadata.size)

      this.setState(_.merge({ metadata, price }, !isGsUri && { signedUrl }))

      if (isGsUri && isFilePreviewable(metadata)) {
        Buckets.getObjectPreview(bucket, name, googleProject, isImage(metadata))
          .then(res => isImage(metadata) ? res.blob().then(URL.createObjectURL) : res.text())
          .then(preview => this.setState({ preview }))
      }

      if (isGsUri) {
        this.setState({ signedUrl: (await Martha.call(uri)).signedUrl || false })
      }
    } catch (e) {
      this.setState({ loadingError: await e.json() })
    }
  }

  renderMetadata() {
    const { uri } = this.props
    const { metadata, preview, signedUrl, price, copied, loadingError } = this.state
    const { size, timeCreated, updated, bucket, name, gsUri } = metadata || {}
    const gsutilCommand = `gsutil cp ${gsUri || uri} .`

    return h(Fragment,
      Utils.cond(
        [
          loadingError, () => [
            div({ style: { paddingBottom: '1rem' } }, ['Error loading data. You may not have permission to view this file.']),
            h(Collapse, { defaultHidden: true, title: 'Details' }, [
              div({ style: { whiteSpace: 'pre-wrap', fontFamily: 'monospace' } }, [JSON.stringify(loadingError, null, 2)])
            ])
          ]
        ],
        [
          metadata, () => [
            els.cell([els.label('Filename'), els.data(_.last(name.split('/')).split('.').join('.\u200B'))]), // allow line break on periods
            els.cell(Utils.cond(
              [!isGs(uri), () => [els.label(`DOS uri's can't be previewed`)]],
              [
                isFilePreviewable(metadata), () => [
                  els.label('Preview'),
                  Utils.cond(
                    [isImage(metadata), () => img({ src: preview, width: 400 })],
                    [
                      preview, () => div({
                        style: {
                          whiteSpace: 'pre', fontFamily: 'Menlo, monospace', fontSize: 12,
                          overflowY: 'auto', maxHeight: 206,
                          marginTop: '0.5rem', padding: '0.5rem',
                          background: colors.gray[5], borderRadius: '0.2rem'
                        }
                      }, [preview])
                    ],
                    () => 'Loading preview...'
                  )
                ]
              ],
              [isImage(metadata), () => els.label('Image is too large to preview')],
              () => [els.label(`File can't be previewed.`)]
            )),
            els.cell([els.label('File size'), els.data(filesize(parseInt(size, 10)))]),
            els.cell([
              link({
                target: 'blank',
                href: Utils.bucketBrowserUrl(bucket)
              }, ['View this file in the Google Cloud Storage Browser'])
            ]),
            els.cell(
              Utils.cond(
                [signedUrl === false, () => 'Unable to generate download link.'],
                () => [
                  div({ style: { display: 'flex', justifyContent: 'center' } }, [
                    buttonPrimary({
                      as: 'a',
                      disabled: !signedUrl,
                      href: signedUrl,
                      target: '_blank'
                    }, signedUrl ?
                      [`Download for ${price}*`] :
                      ['Generating download link...', spinner({ style: { color: 'white', marginLeft: 4 } })]
                    )
                  ])
                ]
              )
            ),
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
                    style: { margin: '0 1rem', color: copied ? colors.green[0] : colors.blue[0] },
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
            (timeCreated || updated) && h(Collapse, { title: 'More Information', defaultHidden: true, style: { marginTop: '2rem' } }, [
              timeCreated && els.cell([els.label('Created'), els.data(new Date(timeCreated).toLocaleString())]),
              updated && els.cell([els.label('Updated'), els.data(new Date(updated).toLocaleString())])
            ]),
            div({ style: { fontSize: 10 } }, ['* Estimated. Download cost may be higher in China or Australia.'])
          ]
        ],
        () => [isGs(uri) ? 'Loading metadata...' : 'Resolving DOS object...', spinner({ style: { marginLeft: 4 } })]
      )
    )
  }

  render() {
    const { uri } = this.props
    const { modalOpen } = this.state

    return h(Fragment, [
      link({
        href: uri,
        onClick: () => {
          this.getMetadata()
          this.setState({ modalOpen: true })
        }
      }, isGs(uri) ? _.last(uri.split('/')) : uri),
      modalOpen && h(Modal, {
        onDismiss: () => this.setState({ modalOpen: false }),
        title: 'File Details',
        showCancel: false,
        showX: true,
        okButton: 'Done'
      }, [
        this.renderMetadata()
      ])
    ])
  }
})

export const renderDataCell = (data, namespace) => {
  const isUri = datum => isGs(datum) || _.startsWith('dos://', datum)

  const renderCell = datum => h(TextCell, { title: datum },
    [isUri(datum) ? h(UriViewer, { uri: datum, googleProject: namespace }) : datum])

  return _.isObject(data) ?
    data.items.map((v, i) => h(Fragment, { key: i }, [
      renderCell(v.toString()), i < (data.items.length - 1) && div({ style: { marginRight: '0.5rem', color: colors.gray[1] } }, ',')
    ])) :
    renderCell(data && data.toString())
}

export const ReferenceDataImporter = ajaxCaller(class ReferenceDataImporter extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }

  render() {
    const { onDismiss, onSuccess, namespace, name, ajax: { Workspaces } } = this.props
    const { loading, selectedReference } = this.state

    return h(Modal, {
      onDismiss,
      title: 'Add Reference Data',
      okButton: buttonPrimary({
        disabled: !selectedReference || loading,
        onClick: () => {
          this.setState({ loading: true })
          Workspaces.workspace(namespace, name).shallowMergeNewAttributes(
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
        autoFocus: true,
        isSearchable: false,
        placeholder: 'Select data',
        value: selectedReference,
        onChange: ({ value }) => this.setState({ selectedReference: value }),
        options: _.keys(ReferenceData)
      }),
      loading && spinnerOverlay
    ])
  }
})

export const ReferenceDataDeleter = ajaxCaller(class ReferenceDataDeleter extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    referenceDataType: PropTypes.string.isRequired
  }

  render() {
    const { onDismiss, onSuccess, namespace, name, referenceDataType, ajax: { Workspaces } } = this.props
    const { deleting } = this.state

    return h(Modal, {
      onDismiss,
      title: 'Confirm Delete',
      okButton: buttonPrimary({
        disabled: deleting,
        onClick: async () => {
          this.setState({ deleting: true })
          try {
            await Workspaces.workspace(namespace, name).deleteAttributes(
              _.map(key => `referenceData-${referenceDataType}-${key}`, _.keys(ReferenceData[referenceDataType]))
            )
            onSuccess()
          } catch (error) {
            reportError('Error deleting reference data', error)
            onDismiss()
          }
        }
      }, ['Delete'])
    }, [`Are you sure you want to delete ${referenceDataType}?`])
  }
})

export const EntityDeleter = ajaxCaller(class EntityDeleter extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    selectedEntities: PropTypes.array.isRequired,
    selectedDataType: PropTypes.string.isRequired,
    runningSubmissionsCount: PropTypes.number.isRequired
  }

  render() {
    const { onDismiss, onSuccess, namespace, name, selectedEntities, selectedDataType, ajax: { Workspaces } } = this.props
    const { deleting } = this.state

    return h(Modal, {
      onDismiss,
      title: 'Confirm Delete',
      okButton: buttonPrimary({
        disabled: deleting,
        onClick: async () => {
          this.setState({ deleting: true })
          try {
            await Workspaces.workspace(namespace, name).deleteEntities(selectedEntities, selectedDataType)
            onSuccess()
          } catch (error) {
            reportError('Error deleting reference data', error)
            onDismiss()
          }
        }
      }, ['Delete'])
    }, [`Are you sure you want to delete ?`])
  }
})
