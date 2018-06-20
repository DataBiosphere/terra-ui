import _ from 'lodash/fp'
import filesize from 'filesize'
import { Fragment } from 'react'
import { code, div, h, pre } from 'react-hyperscript-helpers/lib/index'
import Collapse from 'src/components/Collapse'
import { buttonPrimary, link } from 'src/components/common'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { TextCell } from 'src/components/table'
import { Buckets, Martha } from 'src/libs/ajax'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  cell: children => div({ style: { marginBottom: '0.5rem' } }, children),
  label: text => div({}, text),
  data: children => div({}, children)
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

  async getMetadata() {
    const { googleProject } = this.props
    const { uri } = this.state
    const [bucket, object] = parseUri(uri)

    this.setState({
      metadata: await Buckets.getObject(bucket, object, googleProject),
      preview: isFilePreviewable(uri) ? await Buckets.getObjectPreview(bucket, object, googleProject) : undefined
    })
  }

  async resolveUri() {
    const { uri } = this.props

    if (!_.startsWith('gs://', uri)) {
      this.setState({ uri: await Martha.call(uri) })
    }

    this.getMetadata()
  }

  render() {
    const { uri: originalUri } = this.props
    const { uri, modalOpen, metadata, preview } = this.state

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
      [
        div({ style: { width: 700 } },
          Utils.cond([
            uri, () => {
              const fileName = _.last(uri.split('/'))

              return [
                styles.cell([`Filename: ${fileName}`]),
                h(Fragment, !metadata ? ['Loading metadata...', spinner()] :
                  [
                    styles.cell(isFilePreviewable(fileName) ? [
                      'Preview',
                      preview ? pre({}, [preview]) :
                        div({}, ['Loading preview...', spinner()])
                    ] : ['File can\'t be previewed.']),
                    styles.cell([`File size: ${filesize(metadata.size)}`]),
                    styles.cell([
                      link({
                        target: 'blank',
                        href: `https://accounts.google.com/AccountChooser?continue=https://console.cloud.google.com/storage/browser/${parseUri(
                          uri)[0]}`
                      }, ['View this file in the Google Cloud Storage Browser'])
                    ]),
                    styles.cell([buttonPrimary({}, [`Download for ${formatPriceInDollars(metadata.estimatedCostUSD)}`])]),
                    styles.cell(['gsutil download command: ', code({}, [`gsutil cp ${uri} .`])]),
                    h(Collapse, { title: 'More Information', defaultHidden: true }, [
                      styles.cell([`Created: ${Utils.makePrettyDate(metadata.timeCreated)}`]),
                      styles.cell([`Updated: ${Utils.makePrettyDate(metadata.updated)}`]),
                      styles.cell([`md5: ${metadata.md5Hash}`])
                    ])
                  ]
                )
              ]
            }
          ], () => ['Resolving DOS uri...', spinner()])
        )
      ])
    ])
  }
}

export const renderDataCell = function(data, namespace) {
  const isUri = _.startsWith('gs://', data) || _.startsWith('dos://', data)

  return h(TextCell, { title: data }, [isUri ? h(UriViewer, { uri: data, googleProject: namespace }) : data])
}
