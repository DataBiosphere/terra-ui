import 'src/style.css'

import { storiesOf } from '@storybook/react'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { IGVFileSelector } from 'src/components/IGVFileSelector'

import { mockSelectedEntities as selectedEntities } from './MockSelectedEntities'


RModal.defaultStyles = { overlay: {}, content: {} }

storiesOf('IGVPanel', module)
  .add('As a drawer', () => h(IGVDrawer))

const IGVDrawer = () => {
  const [openDrawer, setOpenDrawer] = useState(true)

  return h(Fragment, [
    h('button', { onClick: () => setOpenDrawer(true), style: { width: '100px' } }, 'Open Drawer'),
    div({ id: 'modal-root' }, [
      h(IGVFileSelector, {
        onSuccess: params => console.log('params:', params),
        openDrawer,
        selectedEntities,
        onDismiss: () => setOpenDrawer(false)
      })
    ])

  ])
}
