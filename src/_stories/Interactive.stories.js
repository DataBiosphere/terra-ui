
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { Interactive } from 'src/components/Interactive'
// import Interactive from 'react-interactive'


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
const containerLevel = [' on the Container', ' on Inner 1', ' on Inner 2']

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
  const items = _.times(n => ({
    disabled: boolean(`Disabled ${containerLevel[n]}`, false),
    style: {
      cursor: text(`Cursor style ${containerLevel[n]}`, 'initial'),
      color: 'black',
      backgroundColor: 'white',
      boxShadow: 'none',
      opacity: 1,
      textDecoration: 'none'
    },
    hover: {
      color: text(`${colorLabel} ${containerLevel[n]}`, 'white'),
      backgroundColor: text(`${bgColorLabel} ${containerLevel[n]}`, 'black'),
      boxShadow: text(`${boxShadowLabel} ${containerLevel[n]}`, '10px 5px 5px gray'),
      opacity: number(`${opacityLabel} ${containerLevel[n]}`, 1, { range: true, min: 0, max: 1, step: 0.1 }),
      textDecoration: text(`${textDecorationLabel} ${containerLevel[n]}`, 'underline')
    }
  }), 3)

  const containerProps = items[0]
  const inner1Props = items[1]
  const inner2Props = items[2]

  return h(Interactive, _.merge({
    as: div,
    onClick: () => 1,
    ...containerProps
  },
  {
    style: { height: '200px', width: '200px', border: '1px solid black', padding: '1rem' }
  })
  , [
    'Container',
    h(Inner1, inner1Props, [
      'Inner 1',
      h(Inner2, inner2Props, ['Inner 2'])
    ])
  ])
}

storiesOf('Interactive', module)
  .addDecorator(withKnobs)
  .add('Single Node Hovering', () => h(SingleHover))
  .add('Nested Hovering', () => h(NestedHover))
