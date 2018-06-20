import clipboard from 'clipboard-polyfill/build/clipboard-polyfill'
import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, input, pre } from 'react-hyperscript-helpers/lib/index'
import Interactive from 'react-interactive'
import Collapse from 'src/components/Collapse'
import { buttonPrimary, link, tooltip } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { TextCell } from 'src/components/table'
import { Buckets, Martha } from 'src/libs/ajax'
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

const isFilePreviewable = name => /\.txt$/.test(name) || /\.[ct]sv$/.test(name) || /\.log/.test(name)
const formatPriceInDollars = price => price < 0.01 ? '< $0.01' : `$${parseFloat(price).toFixed(2)}`
const parseUri = uri => _.drop(1, /gs:[/][/]([^/]+)[/](.+)/.exec(uri))

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

    const [metadata, preview, firecloudApiUrl] = await Promise.all([
      Buckets.getObject(bucket, object, googleProject),
      isFilePreviewable(uri) ? Buckets.getObjectPreview(bucket, object, googleProject) : Promise.resolve(undefined),
      Config.getOrchestrationUrlRoot()
    ])

    this.setState({ metadata, preview, firecloudApiUrl })
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
    const { uri, metadata, preview, firecloudApiUrl, copied } = this.state
    const fileName = _.last(uri.split('/'))
    const [bucket, object] = parseUri(uri)
    const gsutilCommand = `gsutil cp ${uri} .`

    return h(Fragment,
      !metadata ? ['Loading metadata...', spinner()] :
        [
          els.cell(isFilePreviewable(fileName) ? [
            els.label('Preview'),
            preview ? pre({}, [preview]) :
              div({}, ['Loading preview...', spinner()])
          ] : [els.label(`File can't be previewed.`)]),
          els.cell([els.label('File size'), els.data(filesize(metadata.size))]),
          els.cell([
            link({
              target: 'blank',
              href: `https://accounts.google.com/AccountChooser?continue=https://console.cloud.google.com/storage/browser/${bucket}`
            }, ['View this file in the Google Cloud Storage Browser'])
          ]),
          els.cell([
            buttonPrimary({
              onClick: () => window.open(`${firecloudApiUrl}/cookie-authed/download/b/${bucket}/o/${object}`)
            }, [`Download for ${formatPriceInDollars(metadata.estimatedCostUSD)}`])
          ]),
          els.cell([
            els.label('Terminal download command'),
            els.data([
              div({ style: { display: 'flex' } }, [
                input({
                  readonly: '',
                  value: gsutilCommand,
                  style: { width: 'calc(100% - 3rem)', fontWeight: 300 }
                }),
                tooltip({
                  component: h(Interactive, {
                    as: icon(copied ? 'check' : 'copy-to-clipboard'),
                    style: { margin: '0 1rem', color: copied ? Style.colors.success : Style.colors.primary },
                    onClick: async () => {
                      try {
                        await clipboard.writeText(gsutilCommand)
                        this.setState({ copied: true },
                          () => setTimeout(() => this.setState({ copied: undefined }), 1500))
                      } catch (error) {
                        reportError('Error copying to clipboard', error)
                      }
                    }
                  }),
                  text: 'Copy to clipboard',
                  arrow: 'center', align: 'center', group: 'bar'
                })
              ])
            ])
          ]),
          h(Collapse, { title: 'More Information', defaultHidden: true }, [
            els.cell([els.label('Created'), els.data(Utils.makePrettyDate(metadata.timeCreated))]),
            els.cell([els.label('Updated'), els.data(Utils.makePrettyDate(metadata.updated))]),
            els.cell([els.label('md5'), els.data(metadata.md5Hash)])
          ])
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

export const renderDataCell = function(data, namespace) {
  const isUri = _.startsWith('gs://', data) || _.startsWith('dos://', data)

  return h(TextCell, { title: data }, [isUri ? h(UriViewer, { uri: data, googleProject: namespace }) : data])
}
