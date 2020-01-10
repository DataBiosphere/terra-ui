import { action } from '@storybook/addon-actions'
import { number, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import * as Utils from 'src/libs/utils'


const PollingEffectStory = ({ title, ms }) => {
  Utils.usePollingEffect(() => {
    action('Effect Triggered')(`Time: ${Date.now()}`)
  }, { ms })

  return div({ style: { margin: '2rem' } }, [`${title} (last render time ${Date.now()})`])
}

storiesOf('Hooks', module)
  .addDecorator(withKnobs({ escapeHTML: false }))
  .add('usePollingEffect', () => {
    const ms = number('Delay', 1000)
    return h(Fragment, [
      h(PollingEffectStory, { key: _.uniqueId(), title: `Polling Effect with ${ms}ms delay`, ms })
    ])
  })
