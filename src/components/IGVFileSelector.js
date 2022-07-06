import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer, List } from 'react-virtualized'
import ButtonBar from 'src/components/ButtonBar'
import { ButtonPrimary, LabeledCheckbox, Link } from 'src/components/common'
import IGVReferenceSelector, { addIgvRecentlyUsedReference, defaultIgvReference } from 'src/components/IGVReferenceSelector'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const getStrings = v => {
  return Utils.cond(
    [_.isString(v), () => [v]],
    [!!v?.items, () => _.map(getStrings, v.items)],
    () => []
  )
}

const IGVFileSelector = ({ selectedEntities, onSuccess }) => {
  const [refGenome, setRefGenome] = useState(defaultIgvReference)
  const isRefGenomeValid = Boolean(_.get('genome', refGenome) || _.get('reference.fastaURL', refGenome))

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
  const isSelectionValid = !!numSelected

  return div({ style: Style.modalDrawer.content }, [
    h(IGVReferenceSelector, {
      value: refGenome,
      onChange: setRefGenome
    }),
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
        disabled: !isSelectionValid || !isRefGenomeValid,
        tooltip: Utils.cond(
          [!isSelectionValid, () => 'Select at least one file'],
          [!isRefGenomeValid, () => 'Select a reference genome']
        ),
        onClick: () => {
          addIgvRecentlyUsedReference(refGenome)
          onSuccess({ selectedFiles: _.filter('isSelected', selections), refGenome })
        }
      }, ['Launch IGV'])
    })
  ])
}

export default IGVFileSelector
