import { h } from 'react-hyperscript-helpers'
import ErrorView from 'src/components/ErrorView'
import Modal from 'src/components/Modal'
import { errorStore, reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'

export default Utils.connectAtom(errorStore, 'errorState')(
  ({ errorState }) => {
    return errorState ? h(Modal, {
      width: 800,
      showCancel: false,
      onDismiss: () => reportError(undefined)
    }, [
      h(ErrorView, {
        error: errorState, collapses: false
      })
    ]) : null
  }
)
