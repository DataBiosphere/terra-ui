import { action } from '@storybook/addon-actions'
import { boolean, object, text, withKnobs } from '@storybook/addon-knobs'
import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import Interactive from 'src/components/Interactive'


const Inner2 = ({ as = 'div', style, children, ...props }) => h(Interactive, {
  as,
  style: {
    height: '100px',
    width: '100px',
    border: '1px solid black',
    padding: '1rem',
    ...style
  }, ...props
}, [children])

const Inner1 = ({ as ='div', style, children, ...props }) => h(Interactive, {
  as,
  style: {
    height: '150px',
    width: '150px',
    border: '1px solid black',
    padding: '1rem',
    ...style
  },
  ...props
}, [children])

const containerLevel = [' on the Container', ' on Inner 1', ' on Inner 2']

const SingleHover = () => {
  return h(Interactive, {
    as: 'div',
    style: { height: '200px', width: '200px', border: '1px solid black', padding: '1rem', margin: '1rem' },
    hover: object('Hover style', {
      color: 'white',
      backgroundColor: 'black',
      boxShadow: '10px 5px 5px gray',
      opacity: 1,
      textDecoration: 'underline'
    })
  }, ['Hover over me!'])
}

const NestedHover = () => {
  const items = _.times(n => {
    const clickable = boolean(`Clickable ${containerLevel[n]}`, false)
    const enterKey = boolean(`Keyable ${containerLevel[n]}`, false)
    const onClick = clickable ? action(`Click ${containerLevel[n]} was fired`) : undefined
    const onKeyDown = enterKey ? action(`KeyDown ${containerLevel[n]} was fired`) : undefined

    return {
      disabled: boolean(`Disabled ${containerLevel[n]}`, false),
      onKeyDown,
      onClick,
      style: {
        cursor: text(`Cursor style ${containerLevel[n]}`, 'initial'),
        color: 'black',
        backgroundColor: 'white',
        boxShadow: 'none',
        opacity: 1,
        textDecoration: 'none'
      },
      hover: object(`Hover style ${containerLevel[n]}`, {
        color: 'white',
        backgroundColor: 'black',
        boxShadow: '10px 5px 5px gray',
        opacity: 1,
        textDecoration: 'underline'
      })
    }
  }, 3)

  const containerProps = items[0]
  const inner1Props = items[1]
  const inner2Props = items[2]

  return h(Interactive, _.merge({
    as: 'div',
    ...containerProps
  }, { style: { height: '200px', width: '200px', border: '1px solid black', padding: '1rem' } }), [
    'Container',
    h(Inner1, inner1Props, ['Inner 1', h(Inner2, inner2Props, ['Inner 2'])])
  ])
}

storiesOf('Interactive', module)
  .addDecorator(withKnobs)
  .add('Single Node Hovering', () => h(SingleHover))
  .add('Nested Hovering', () => h(NestedHover))
