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
    const allAttributeStrings = _.flow(
      _.flatMap(row => _.flatMap(getStrings, row.attributes)),
      _.uniq
    )(selectedEntities)

    return _.flatMap(filePath => {
      const possibleFile = /(.+)\.([^.]+)$/.exec(filePath)

      if (!possibleFile) return []

      const [, base, extension] = possibleFile

      const matchingIndexFilePath = Utils.switchCase(extension,
        ['cram', () => _.find(v => _.includes(v, [`${base}.crai`, `${base}.cram.crai`]), allAttributeStrings)],
        ['bam', () => _.find(v => _.includes(v, [`${base}.bai`, `${base}.bam.bai`]), allAttributeStrings)],
        ['vcf', () => _.find(v => _.includes(v, [`${base}.idx`, `${base}.vcf.idx`, `${base}.tbi`, `${base}.vcf.tbi`]), allAttributeStrings)],
        ['bed', () => false],
        [Utils.DEFAULT, () => undefined]
      )

      return matchingIndexFilePath !== undefined ? [{ filePath, indexFilePath: matchingIndexFilePath }] : []
    }, allAttributeStrings)
  })

  const toggleSelected = index => setSelections(_.update([index, 'isSelected'], v => !v))
  const numSelected = _.countBy('isSelected', selections).true
  const isSelectionValid = !!numSelected && numSelected <= MAX_CONCURRENT_IGV_FILES

  return div({ style: Style.modalDrawer.content }, [
    h(IdContainer, [id => div({ style: { fontWeight: 500 } }, [
      label({ htmlFor: id }, ['Reference genome: ']),
      div({ style: { display: 'inline-block', marginLeft: '0.25rem', marginBottom: '1rem', minWidth: 125 } }, [
        h(Select, {
          id,
          options: ['hg38', 'hg19', 'hg18', 'ASM985889v3', 'mm10', 'panTro4', 'panPan2', 'susScr11', 'bosTau8', 'canFam3', 'rn6', 'danRer10', 'dm6', 'sacCer3'],
          value: refGenome,
          onChange: ({ value }) => setRefGenome(value)
        })
      ])
    ])]),
    div({ style: { marginBottom: '1rem', display: 'flex' } }, [
      div({ style: { fontWeight: 500 } }, ['Select:']),
      h(Link, { style: { padding: '0 0.5rem' }, onClick: () => setSelections(_.map(_.set('isSelected', true))) }, ['all']),
      '|',
      h(Link, { style: { padding: '0 0.5rem' }, onClick: () => setSelections(_.map(_.set('isSelected', false))) }, ['none'])
    ]),
    div({ style: { flex: 1, marginBottom: '3rem' } }, [
      h(AutoSizer, [
        ({ width, height }) => {
          return h(List, {
            height,
            width,
            rowCount: selections.length,
            rowHeight: 30,
            noRowsRenderer: () => 'No valid files with indices found',
            rowRenderer: ({ index, style, key }) => {
              const { filePath, isSelected } = selections[index]
              return div({ key, style: { ...style, display: 'flex' } }, [
                h(LabeledCheckbox, {
                  checked: isSelected,
                  onChange: () => toggleSelected(index)
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
        onClick: () => onSuccess({ selectedFiles: _.filter('isSelected', selections), refGenome })
      }, ['Launch IGV'])
    })
  ])
}

export default IGVFileSelector
