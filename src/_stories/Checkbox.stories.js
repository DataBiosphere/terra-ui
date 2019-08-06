import { number, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { LabeledCheckbox } from 'src/components/common'


const DEFTAULT_CHECKBOXES = 3

const CheckStory = ({ index }) => {
  const [checked, setChecked] = useState(true)
  return div({ style: { width: `${number('Container Width', 500)}px`, margin: '2px' } }, [
    h(LabeledCheckbox, {
      checked,
      onChange: setChecked
    }, [text(`Label ${index}`, `Test Label ${index}`)])
  ])
}

storiesOf('Checkbox', module)
  .addDecorator(withKnobs({ escapeHTML: false }))
  .add('Labeled', () => {
    return h(Fragment, [
      _.times(index => h(CheckStory, { index }),
        number('Number of checkboxes ', DEFTAULT_CHECKBOXES, { range: true, min: 0, max: 20 }))
    ])
  })
