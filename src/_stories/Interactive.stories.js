
import { number, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'


const nestedClickable2 = h(Clickable, {
  style: {
    height: '100px',
    width: '100px',
    border: '1px solid black',
    padding: '1rem',
    color: 'black'
  }, hover: { color: 'green' }
}, ['buddy'])

const nestedClickable1 = h(Clickable, {
  style: {
    height: '150px',
    width: '150px',
    border: '1px solid black',
    padding: '1rem',
    color: 'black'
  }, hover: { color: 'blue' }
}, ['there', nestedClickable2])

const SingleHover = () => {
  const color = text('Text Color (enter a valid CSS color)', 'white')
  const backgroundColor = text('Background Color (enter a valid CSS color)', 'black')
  const boxShadow = text('Box Shadow', '10px 5px 5px gray')
  const opacity = number('Opacity', 1, { range: true, min: 0, max: 1, step: 0.1 })

  return h(Clickable, {
    style: { height: '200px', width: '200px', border: '1px solid black', padding: '1rem', margin: '1rem' },
    hover: { color, backgroundColor, boxShadow, opacity }
  }, ['Hi'])
}

const NestedHover = () => {
  return h(Clickable, {
    style: { height: '200px', width: '200px', border: '1px solid black', padding: '1rem' },
    hover: { color: 'red' }
  }, [
    'Hi',
    nestedClickable1
  ])
}

storiesOf('Interactive', module)
  .addDecorator(withKnobs)
  .add('Single Node Hovering', () => h(SingleHover))
  .add('Nested Hovering', () => h(NestedHover))
