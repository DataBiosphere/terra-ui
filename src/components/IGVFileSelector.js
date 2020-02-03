import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import { AutoSizer, List } from 'react-virtualized'
import ButtonBar from 'src/components/ButtonBar'
import { ButtonPrimary, IdContainer, LabeledCheckbox, Link, Select } from 'src/components/common'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const getStrings = v => {
  return Utils.cond(
    [_.isString(v), () => [v]],
    [!!v?.items, () => _.map(getStrings, v.items)],
    () => []
  )
}

const MAX_CONCURRENT_IGV_FILES = 10

const IGVFileSelector = ({ selectedEntities, onSuccess }) => {
  const [refGenome, setRefGenome] = useState('hg38')
  const [selections, setSelections] = useState(() => {
    const allFiles = _.flow(
      _.flatMap(row => _.flatMap(getStrings, row.attributes)),
      _.uniq
    )(selectedEntities)

    return _.reduce((acc, filePath) => {
      const [, base, extension] = /(.+)\.([^.]+)$/.exec(filePath) || []

      if (!base) return acc

      const matchingIndex = Utils.switchCase(extension,
        ['cram', () => _.find(v => _.includes(v, [`${base}.crai`, `${base}.cram.crai`]), allFiles)],
        ['bam', () => _.find(v => _.includes(v, [`${base}.bai`, `${base}.bam.bai`]), allFiles)],
        ['vcf', () => _.find(v => _.includes(v, [`${base}.idx`, `${base}.vcf.idx`, `${base}.tbi`, `${base}.vcf.tbi`]), allFiles)],
        ['bed', () => undefined],
        [Utils.DEFAULT, () => false]
      )

      return matchingIndex !== false ? _.set([filePath, 'indexFile'], matchingIndex, acc) : acc
    }, {}, allFiles)
  })

  const toggleSelected = filePath => setSelections(_.set([filePath, 'isSelected'], !selections[filePath].isSelected))
  const numSelected = _.countBy('isSelected', selections).true
  const isSelectionValid = !!numSelected && numSelected <= MAX_CONCURRENT_IGV_FILES

  const validFiles = _.keys(selections)

  return div({ style: Style.modalDrawer.content }, [
    h(IdContainer, [id => div({ style: { fontWeight: 500 } }, [
      label({ htmlFor: id }, ['Reference genome: ']),
      div({ style: { display: 'inline-block', marginLeft: '0.25rem', marginBottom: '1rem', minWidth: 125 } }, [
        h(Select, {
          id,
          options: ['hg38', 'hg19', 'hg18', 'mm10', 'panTro4', 'panPan2', 'susScr11', 'bosTau8', 'canFam3', 'rn6', 'danRer10', 'dm6', 'sacCer3'],
          value: refGenome,
          onChange: setRefGenome
        })
      ])
    ])]),
    div({ style: { marginBottom: '1rem', display: 'flex' } }, [
      div({ style: { fontWeight: 500 } }, ['Select:']),
      h(Link, { style: { padding: '0 0.5rem' }, onClick: () => setSelections(_.mapValues(_.set('isSelected', true))) }, ['all']),
      '|',
      h(Link, { style: { padding: '0 0.5rem' }, onClick: () => setSelections(_.mapValues(_.set('isSelected', false))) }, ['none'])
    ]),
    div({ style: { flex: 1, marginBottom: '3rem' } }, [
      h(AutoSizer, [
        ({ width, height }) => {
          return h(List, {
            height,
            width,
            rowCount: validFiles.length,
            rowHeight: 30,
            noRowsRenderer: () => 'No valid files with indices found',
            rowRenderer: ({ index, style, key }) => {
              const filePath = validFiles[index]
              return div({ key, style: { ...style, display: 'flex' } }, [
                h(LabeledCheckbox, {
                  checked: selections[filePath].isSelected,
                  onChange: () => toggleSelected(filePath)
                }, [
                  div({ style: { paddingLeft: '0.25rem', flex: 1, ...Style.noWrapEllipsis } }, [_.last(filePath.split('/'))])
                ])
              ])
            }
          })
        }
      ])
    ]),
    h(ButtonBar, {
      style: Style.modalDrawer.buttonBar,
      okButton: h(ButtonPrimary, {
        disabled: !isSelectionValid,
        tooltip: !isSelectionValid && `Select between 1 and ${MAX_CONCURRENT_IGV_FILES} files`,
        onClick: () => onSuccess({ selectedFiles: _.pickBy('isSelected', selections), refGenome })
      }, ['Launch IGV'])
    })
  ])
}

export default IGVFileSelector
