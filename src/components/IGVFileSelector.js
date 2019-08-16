import _ from 'lodash/fp'
import { Component } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import { AutoSizer, List } from 'react-virtualized'
import ButtonBar from 'src/components/ButtonBar'
import { ButtonPrimary, Clickable, IdContainer, LabeledCheckbox, Link, Select } from 'src/components/common'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  columnName: {
    paddingLeft: '0.25rem',
    flex: 1, display: 'flex', alignItems: 'center',
    ...Style.noWrapEllipsis
  }
}

const getStrings = v => {
  return Utils.cond(
    [_.isString(v), () => [v]],
    [v && v.items, () => _.map(getStrings, v.items)],
    () => []
  )
}

const MAX_CONCURRENT_IGV_FILES = 10

export class IGVFileSelector extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedFiles: _.fromPairs(_.map(v => [v, false], this.getIGVFileList())),
      refGenome: 'hg38'
    }
  }

  toggleVisibility(name) {
    this.setState(_.update(['selectedFiles', name], b => !b))
  }

  getIGVFileList() {
    const { selectedEntities } = this.props
    return _.flow(
      _.flatMap(row => _.flatMap(getStrings, row.attributes)),
      _.uniq,
      _.filter(v => /\.(cram|bam|bed|vcf)$/.test(v))
    )(selectedEntities)
  }

  getSelectedFilesList() {
    const { selectedFiles } = this.state
    return _.flow(
      _.keys,
      _.filter(v => selectedFiles[v])
    )(selectedFiles)
  }

  buttonIsDisabled() {
    const selectedFilesList = this.getSelectedFilesList()
    return !(selectedFilesList.length > 0 && selectedFilesList.length <= MAX_CONCURRENT_IGV_FILES)
  }

  setAll(value) {
    this.setState({ selectedFiles: _.fromPairs(_.map(v => [v, value], this.getIGVFileList())) })
  }

  render() {
    const { onSuccess } = this.props
    const { selectedFiles, refGenome } = this.state
    const trackFiles = this.getIGVFileList()

    return div({ style: Style.modalDrawer.content }, [
      h(IdContainer, [id => div({ style: { fontWeight: 500 } }, [
        label({ htmlFor: id }, ['Reference genome: ']),
        div({ style: { display: 'inline-block', marginLeft: '0.25rem', marginBottom: '1rem', minWidth: 125 } }, [
          h(Select, {
            id,
            options: ['hg38', 'hg19', 'hg18', 'mm10', 'panTro4', 'panPan2', 'susScr11',
              'bosTau8', 'canFam3', 'rn6', 'danRer10', 'dm6', 'sacCer3'],
            value: refGenome,
            onChange: ({ value }) => this.setState({ refGenome: value })
          })
        ])
      ])]),
      div({ style: { marginBottom: '1rem', display: 'flex' } }, [
        div({ style: { fontWeight: 500 } }, ['Select:']),
        h(Link, { style: { padding: '0 0.5rem' }, onClick: () => this.setAll(true) }, ['all']),
        '|',
        h(Link, { style: { padding: '0 0.5rem' }, onClick: () => this.setAll(false) }, ['none'])
      ]),
      div({ style: { flex: 1, marginBottom: '3rem' } }, [
        h(AutoSizer, [
          ({ width, height }) => {
            return h(List, {
              height,
              width,
              rowCount: trackFiles.length,
              rowHeight: 30,
              noRowsRenderer: () => 'No valid files found',
              rowRenderer: ({ index, style, key }) => {
                const name = trackFiles[index]
                return div({ key, index, style: { ...style, marginBottom: 'auto', display: 'flex' } }, [
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
                  }, [_.last(name.split('/'))])
                ])
              }
            })
          }
        ])
      ]),
      h(ButtonBar, {
        style: Style.modalDrawer.buttonBar,
        okButton: h(ButtonPrimary, {
          disabled: this.buttonIsDisabled(),
          tooltip: this.buttonIsDisabled() ? `Select between 1 and ${MAX_CONCURRENT_IGV_FILES} files` : '',
          onClick: () => onSuccess({ selectedFiles: this.getSelectedFilesList(), refGenome })
        }, ['Launch IGV'])
      })
    ])
  }
}
