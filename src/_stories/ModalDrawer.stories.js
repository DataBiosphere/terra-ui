import { number, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import ModalDrawer from 'src/components/ModalDrawer'


const openButton = ({ onClick }) => h('button', { onClick, style: { width: '100px' } }, 'Open Drawer')

const ModalDrawerEmpty = () => {
  const [isOpen, setIsOpen] = useState(true)
  const width = number('Width', 450)

  return h(Fragment, [
    openButton({ onClick: () => setIsOpen(true) }),
    div({ id: 'modal-root' }, [
      h(ModalDrawer, {
        isOpen,
        width,
        onDismiss: () => setIsOpen(false)
      })
    ])
  ])
}

const ModalDrawerWithContent = () => {
  const [isOpen, setIsOpen] = useState(true)
  const width = number('Width', 450)

  return h(Fragment, [
    openButton({ onClick: () => setIsOpen(true) }),
    div({ id: 'modal-root' }, [
      h(ModalDrawer, {
        width,
        isOpen,
        onDismiss: () => setIsOpen(false)
      }, [
        h(div, {
          style: { display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 'none', padding: '1.5rem 1.25rem' }
        }, 'Content 1 - Test Content'),
        div({
          style: {
            display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 1, padding: '1.5rem 1.25rem',
            overflow: 'auto'
          }
        }, 'Content 2 - Test Content'),
        h('div', {
          style: {
            marginTop: 'auto', backgroundColor: 'lightblue', padding: '1.75rem 1.25rem',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'
          }
        }, ['Content 3 - Bottom aligned'])
      ])
    ])
  ])
}

storiesOf('Modal Drawer', module)
  .addDecorator(withKnobs)
  .add('Empty', () => h(ModalDrawerEmpty))
  .add('With Content', () => h(ModalDrawerWithContent))
