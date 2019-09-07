
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

const IGVDrawer = () => {
  return h(Clickable, {
    style: { height: '200px', width: '200px', border: '1px solid black', padding: '1rem' },
    hover: { color: 'red' }
  }, [
    'hello',
    nestedClickable1
  ])
}

storiesOf('Interactive', module)
  .add('Set the number of rows', () => h(IGVDrawer))
