
import { number, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { div, h } from 'react-hyperscript-helpers'
import { Interactive } from 'src/components/common'


console.log(Interactive)

const Inner2 = ({ style, hover, children }) => h(Interactive, {
  as: div,
  style: {
    height: '100px',
    width: '100px',
    border: '1px solid black',
    padding: '1rem',
    ...style
  }, hover
}, [children])

const Inner1 = ({ style, hover, children }) => h(Interactive, {
  as: div,
  style: {
    height: '150px',
    width: '150px',
    border: '1px solid black',
    padding: '1rem',
    ...style
  }, hover
}, [children])


const colorLabel = 'Text Color (enter a valid CSS color)'
const bgColorLabel = 'Background Color (enter a valid CSS color)'
const boxShadowLabel = 'Box Shadow'
const opacityLabel = 'Opacity'
const textDecorationLabel = 'Text Decoration'

const SingleHover = () => {
  const color = text(colorLabel, 'white')
  const backgroundColor = text(bgColorLabel, 'black')
  const boxShadow = text(boxShadowLabel, '10px 5px 5px gray')
  const opacity = number(opacityLabel, 1, { range: true, min: 0, max: 1, step: 0.1 })
  const textDecoration = text(textDecorationLabel, 'underline')

  return h(Interactive, {
    as: div,
    style: { height: '200px', width: '200px', border: '1px solid black', padding: '1rem', margin: '1rem' },
    hover: { color, backgroundColor, boxShadow, opacity, textDecoration }
  }, ['Hiya Buddy!'])
}

const NestedHover = () => {
  const color = text(colorLabel, 'white')
  const backgroundColor = text(bgColorLabel, 'black')
  const boxShadow = text(boxShadowLabel, '10px 5px 5px gray')
  const opacity = number(opacityLabel, 1, { range: true, min: 0, max: 1, step: 0.1 })
  const textDecoration = text(textDecorationLabel, 'underline')

  const initialSetting = { color: 'black', backgroundColor: 'white', boxShadow: 'none', opacity: 1, textDecoration: 'none' }
  const containerHover = { color, backgroundColor, boxShadow, opacity, textDecoration }
  const inner1Hover = { color, backgroundColor, boxShadow, opacity, textDecoration }
  const inner2Hover = { color, backgroundColor, boxShadow, opacity, textDecoration }

  return h(Interactive, {
    as: div,
    style: { height: '200px', width: '200px', border: '1px solid black', padding: '1rem' },
    hover: containerHover
  }, [
    'Container',
    h(Inner1, { style: initialSetting, hover: inner1Hover }, [
      'Inner 1',
      h(Inner2, { style: initialSetting, hover: inner2Hover }, ['Inner 2'])
    ])
  ])
}

storiesOf('Interactive', module)
  .addDecorator(withKnobs)
  .add('Single Node Hovering', () => h(SingleHover))
  .add('Nested Hovering', () => h(NestedHover))
