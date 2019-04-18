import { Fragment } from 'react'
import _ from 'lodash/fp'
import { Component } from 'src/libs/wrapped-components'
import { div, h } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import { buttonPrimary, Checkbox, Clickable } from 'src/components/common'
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
const SortableDiv = SortableElement(props => div(props))
const SortableList = SortableContainer(props => h(List, props))

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
      _.filter(v => ['cram', 'bam', 'bed', 'vcf'].includes(v.split('.').pop()))
    )(selectedFiles)
  }

  componentDidMount() {
    const { selectedEntities } = this.props
    const initializeSelectedFiles = _.reduce((result, value) => { result[value] = true; return result }, {})
    this.setState({ selectedFiles: initializeSelectedFiles(this.getIGVFileList(selectedEntities)) })
  }

  render() {
    const { onDismiss, onSuccess, selectedEntities } = this.props
    const { selectedFiles } = this.state
    const trackFiles = this.getIGVFileList(selectedEntities)
    return h(Fragment, [
      h(Modal, {
        onDismiss,
        title: 'Opening files with IGV',
        okButton: buttonPrimary({
          onClick: () => {
            onSuccess(selectedFiles)
          }
        }, ['Done'])
      }, [
        h(AutoSizer, { disableHeight: true }, [
          ({ width }) => {
            return h(SortableList, {
              style: { outline: 'none' },
              lockAxis: 'y',
              useDragHandle: true,
              width, height: 400,
              rowCount: trackFiles.length,
              rowHeight: 30,
              rowRenderer: ({ index, style, key }) => {
                const name = trackFiles[index]
                return h(SortableDiv, { key, index, style: { ...style, display: 'flex' } }, [
                  div({ style: { display: 'flex', alignItems: 'center' } }, [
                    h(Checkbox, {
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
    ])
  }
}
