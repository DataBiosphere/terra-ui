import { action } from '@storybook/addon-actions'
import { number, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import IGVFileSelector from 'src/components/IGVFileSelector'


const DEFAULT_ENTITIES = 3

const withUniqueEntities = numElements => {
  return _.times(iteration => {
    const bamName = 'gs://cancer-exome-pipeline-demo-data/HCC1143.100_gene_250bp_pad'
    const bam = `${bamName}-${iteration}.bam`
    const bai = `${bamName}-${iteration}.bai`
    return {
      attributes: { bam, bai }
    }
  }, numElements)
}

const IGVDrawer = () => {
  const numEntities = number('Number of rows to display', DEFAULT_ENTITIES, { range: true, min: 0, max: 100 })

  return h(Fragment, [
    div({ style: { display: 'flex', flex: 1, width: '50%', border: '1px solid black', paddingTop: '1rem' } }, [
      h(IGVFileSelector, {
        onSuccess: action('Launch IGV Clicked'),
        selectedEntities: withUniqueEntities(numEntities)
      })
    ])
  ])
}

storiesOf('IGVPanel', module)
  .addDecorator(withKnobs)
  .add('Set the number of rows', () => h(IGVDrawer))
