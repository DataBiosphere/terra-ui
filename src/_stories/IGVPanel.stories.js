import { action } from '@storybook/addon-actions'
import { number, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { IGVFileSelector } from 'src/components/IGVFileSelector'

import { mockSelectedEntities as selectedEntities } from '_stories/mockdata/mock-selected-entities'


const DEFAULT_ENTITIES = 3

const withUniqueEntities = (numElements, entityList) => {
  const elementCount = Math.min(numElements, _.size(entityList) - 1)
  const entityPairs = _.flow(_.toPairs, _.take(elementCount))(entityList)
  const entityWithIndex = _.zip(entityPairs, _.range(0, entityPairs.length))
  return _.flow(
    _.map(item => {
      const uniqueItem = _.cloneDeep(item[0][1])
      const name = uniqueItem.attributes.bam.split('.')
      const strippedName = _.take(name.length - 1, name).join('.')
      uniqueItem.attributes.bam = `${strippedName}-${item[1]}.bam`
      return [item[0][0], uniqueItem]
    }),
    _.fromPairs
  )(entityWithIndex)
}

const IGVDrawer = () => {
  const numEntities = number('Number of rows to display', DEFAULT_ENTITIES, { range: true, min: 0, max: _.size(selectedEntities) })
  const [openDrawer, setOpenDrawer] = useState(true)

  return h(Fragment, [
    h('button', { onClick: () => setOpenDrawer(true), style: { width: '100px' } }, 'Open Drawer'),
    div({ id: 'modal-root' }, [
      h(IGVFileSelector, {
        onSuccess: action('Launch IGV Clicked'),
        openDrawer,
        selectedEntities: withUniqueEntities(numEntities, selectedEntities),
        onDismiss: () => setOpenDrawer(false)
      })
    ])
  ])
}

storiesOf('IGVPanel', module)
  .addDecorator(withKnobs)
  .add('Set the number of rows', () => h(IGVDrawer))
