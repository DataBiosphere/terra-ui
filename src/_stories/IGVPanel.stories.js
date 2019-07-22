import { action } from '@storybook/addon-actions'
import { number, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { IGVFileSelector } from 'src/components/IGVFileSelector'


const DEFAULT_ENTITIES = 3

const withUniqueEntities = numElements => {
  return _.times(iteration => {
    const bamName = 'gs://cancer-exome-pipeline-demo-data/HCC1143.100_gene_250bp_pad'
    const bam = `${bamName}-${iteration}.bam`
    return {
      attributes: { bam }
    }
  }, numElements)
}

const IGVDrawer = () => {
  const numEntities = number('Number of rows to display', DEFAULT_ENTITIES, { range: true, min: 0, max: 100 })
  const [openDrawer, setOpenDrawer] = useState(true)

  return h(Fragment, [
    h('button', { onClick: () => setOpenDrawer(true), style: { width: '100px' } }, 'Open Drawer'),
    div({ id: 'modal-root' }, [
      h(IGVFileSelector, {
        onSuccess: action('Launch IGV Clicked'),
        openDrawer,
        selectedEntities: withUniqueEntities(numEntities),
        onDismiss: () => setOpenDrawer(false)
      })
    ])
  ])
}

storiesOf('IGVPanel', module)
  .addDecorator(withKnobs)
  .add('Set the number of rows', () => h(IGVDrawer))
