import { useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


const RenameTableModal = ({ onDismiss, selectedDataType, workspace }) => {
  // State
  const [renaming, setRenaming] = useState(false)

  return h(Modal, {
    onDismiss,
    title: 'Rename Data Table',
    okButton: h(ButtonPrimary, {
      disabled: renaming,
      onClick: console.log(selectedDataType)
    }, ['Copy'])
  }, [])
}

export default RenameTableModal
