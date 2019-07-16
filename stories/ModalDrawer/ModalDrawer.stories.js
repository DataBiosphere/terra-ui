import { storiesOf } from '@storybook/react'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import ButtonBar from 'src/components/ButtonBar'
import ModalDrawer from 'src/components/ModalDrawer'


RModal.defaultStyles = { overlay: {}, content: {} }

storiesOf('Modal Drawer', module)
  .add('Open/Close', () => h(ModalDrawerTest))
  .add('With Content', () => h(ModalDrawerFull))
  .add('With Button bar', () => h(ModalDrawerButtonBar))
const styles = {
  title: {
    display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 'none', padding: '1.5rem 1.25rem'
  },
  titleAlign: hasPrevious => ({ marginLeft: hasPrevious ? 'auto' : undefined })
}

const ModalDrawerTest = () => {
  const [openDrawer, setOpenDrawer] = useState(true)

  return h(Fragment, [
    h('button', { onClick: () => setOpenDrawer(true) }, 'Open Drawer'),
    div({ id: 'modal-root' }, [
      h(ModalDrawer, {
        openDrawer: openDrawer,
        onDismiss: () => setOpenDrawer(false)
      })
    ])
  ])
}

const ModalDrawerFull = () => {
  const [openDrawer, setOpenDrawer] = useState(true)

  return h(Fragment, [
    h('button', { onClick: () => setOpenDrawer(true) }, 'Open Drawer'),
    div({ id: 'modal-root' }, [
      h(ModalDrawer, {
        openDrawer: openDrawer,
        onDismiss: () => setOpenDrawer(false)
      }, [
        h(div, { style: styles.title }, 'Content 1 - Title'),
        div({
          style: {
            display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 1, padding: '1.5rem 1.25rem',
            overflow: 'auto'
          }
        }, 'Content 2 - body'),
        h('div', {
          style: {
            marginTop: 'auto', backgroundColor: 'lightblue', padding: '1.75rem 1.25rem',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'
          }
        }, ['Content 3 - footer'])
      ])
    ])
  ])
}

const ModalDrawerButtonBar = () => {
  const [openDrawer, setOpenDrawer] = useState(true)

  return h(Fragment, [
    h('button', { onClick: () => setOpenDrawer(true) }, 'Open Drawer'),
    div({ id: 'modal-root' }, [
      h(ModalDrawer, {
        openDrawer: openDrawer,
        onDismiss: () => setOpenDrawer(false)
      }, [
        h(div, { style: styles.title }, 'Content 1 - Title'),
        div({
          style: {
            display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 1, padding: '1.5rem 1.25rem',
            overflow: 'auto'
          }
        }, 'Content 2 - body'),
        h(ButtonBar, {
          onOk: () => this.setState({ openDrawer: false }), onCancel: () => this.setState({ openDrawer: false }), style: {
            marginTop: 'auto', backgroundColor: 'lightblue', padding: '1.75rem 1.25rem',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'
          }
        })
      ])
    ])
  ])
}

// Other test cases:
// 1. Various content
// 2. Title Only
// 3. Title and buttons only
// 4. Title, buttons and content
// 5. Content Only
// 6. Title and content
// 7. Scrolling content
// 8. Async Close


