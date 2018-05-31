import { h } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import { errorStore, reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'

export default Utils.connectAtom(errorStore, 'errorState')(
  ({ errorState }) => {
    return errorState ? h(Modal, {
      showCancel: false,
      onDismiss: () => reportError(undefined)
    }, [errorState]) : null
  }
)
