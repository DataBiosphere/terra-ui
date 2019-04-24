import _ from 'lodash/fp'
import { Component } from 'src/libs/wrapped-components'
import { div, h } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import { buttonPrimary, LabeledCheckbox, Clickable } from 'src/components/common'
import { AutoSizer, List } from 'react-virtualized'

const styles = {
  columnName: {
    paddingLeft: '0.25rem',
    flex: 1, display: 'flex', alignItems: 'center',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  columnHandle: {
    paddingRight: '0.25rem', cursor: 'move',
    display: 'flex', alignItems: 'center'
  }
}

export class IGVFileSelector extends Component {
  constructor(props) {
    super(props)
    this.state = { selectedFiles: undefined }
  }

  toggleVisibility(name) {
    this.setState(_.update(['selectedFiles', name], b => !b))
  }

  getIGVFileList(selectedFiles) {
    return _.flow(
      _.values,
      _.map(k => _.values(k['attributes'])),
      _.flattenDeep,
      _.filter(v => ['cram', 'bam', 'bed', 'vcf'].includes(_.last(v.split('.'))))
    )(selectedFiles)
  }

  componentDidMount() {
    const { selectedEntities } = this.props
    const initializeSelectedFiles = _.flow(v => [v, true], _.fromPairs)
    this.setState({ selectedFiles: initializeSelectedFiles(this.getIGVFileList(selectedEntities)) })
  }

  render() {
    const { onDismiss, onSuccess, selectedEntities } = this.props
    const { selectedFiles } = this.state
    const trackFiles = this.getIGVFileList(selectedEntities)
    return h(Modal, {
      onDismiss,
      title: 'Opening files with IGV',
      okButton: buttonPrimary({
        onClick: () => {
          const actuallySelectedFiles = _.flow(
            _.keys,
            _.filter(v => selectedFiles[v])
          )(selectedFiles)
          onSuccess(actuallySelectedFiles)
        }
      }, ['Done'])
    }, [
      h(AutoSizer, { disableHeight: true }, [
        ({ width }) => {
          return h(List, {
            style: { outline: 'none' },
            lockAxis: 'y',
            useDragHandle: true,
            width, height: 400,
            rowCount: trackFiles.length,
            rowHeight: 30,
            rowRenderer: ({ index, style, key }) => {
              const name = trackFiles[index]
              return div({ key, index, style: { ...style, display: 'flex' } }, [
                div({ style: { display: 'flex', alignItems: 'center' } }, [
                  h(LabeledCheckbox, {
                    checked: selectedFiles[name],
                    onChange: () => this.toggleVisibility(name)
                  })
                ]),
                h(Clickable, {
                  style: styles.columnName,
                  title: name,
                  onClick: () => this.toggleVisibility(name)
                }, [name])
              ])
            }
          })
        }
      ])
    ])
  }
}
